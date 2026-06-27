"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const STAGES = ["New Lead", "Contacted", "Meeting Scheduled", "Proposal Sent", "Closed Won", "Closed Lost"];

type Lead = {
  id: string;
  summary: string;
  pipelineStage: string;
  leadScore: number;
  intent: string;
};

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/pipeline")
      .then((res) => res.json())
      .then((data) => setLeads(data.leads || []));
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStage = destination.droppableId;
    
    // Optimistic UI update
    setLeads((prev) => 
      prev.map((lead) => 
        lead.id === draggableId ? { ...lead, pipelineStage: newStage } : lead
      )
    );

    // Persist change
    await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: draggableId, stage: newStage }),
    });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold">Sales Pipeline</h1>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.pipelineStage === stage || (stage === "New Lead" && !l.pipelineStage));
            
            return (
              <div key={stage} className="flex h-full w-80 flex-col rounded-lg bg-muted p-4 shrink-0">
                <h3 className="mb-4 font-semibold text-sm text-muted-foreground flex justify-between">
                  {stage}
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs">{stageLeads.length}</span>
                </h3>
                
                <Droppable droppableId={stage}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 space-y-3 overflow-y-auto"
                    >
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="rounded-md border border-border bg-card p-3 shadow-sm"
                            >
                              <p className="text-sm font-medium">{lead.summary}</p>
                              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Score: {lead.leadScore}</span>
                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                                  {lead.intent}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
