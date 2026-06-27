"use client";

import { useState, useCallback } from "react";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialNodes = [
  { id: "1", type: "input", data: { label: "Trigger: Email Received" }, position: { x: 250, y: 5 } },
];
const initialEdges: any[] = [];

export default function AutomationPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const { toast } = useToast();

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNode = (type: string, label: string) => {
    const newNode = {
      id: Date.now().toString(),
      type: "default",
      data: { label },
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleSave = async () => {
    // In a real app, map xyflow nodes/edges to our WorkflowNode schema
    const workflowNodes = nodes.map(n => {
      // simple logic to find next node
      const edge = edges.find(e => e.source === n.id);
      return {
        id: n.id,
        type: n.data.label.toString().toLowerCase().includes("trigger") ? "start" : "action",
        data: n.data,
        position: n.position,
        nextNodeId: edge?.target || null,
      };
    });

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          description: "Visual workflow",
          triggerType: "email_received",
          triggerConfig: {},
          nodes: workflowNodes,
        }),
      });
      if (res.ok) {
        toast({ title: "Saved", description: "Workflow saved successfully." });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save workflow.", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="w-64 border-r bg-background p-4 flex flex-col gap-4">
        <h3 className="font-semibold text-lg">Nodes</h3>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">Triggers</Label>
          <Button variant="outline" className="w-full justify-start text-left" onClick={() => addNode("input", "Trigger: Stage Changed")}>
            Stage Changed
          </Button>
          <Button variant="outline" className="w-full justify-start text-left" onClick={() => addNode("input", "Trigger: Lead Score")}>
            Lead Score Change
          </Button>
        </div>

        <div className="space-y-2 mt-4">
          <Label className="text-xs text-muted-foreground uppercase">Actions</Label>
          <Button variant="outline" className="w-full justify-start text-left" onClick={() => addNode("default", "AI Draft Email")}>
            AI Draft Email
          </Button>
          <Button variant="outline" className="w-full justify-start text-left" onClick={() => addNode("default", "Send Email")}>
            Send Email
          </Button>
          <Button variant="outline" className="w-full justify-start text-left" onClick={() => addNode("default", "Move Stage")}>
            Move Pipeline Stage
          </Button>
          <Button variant="outline" className="w-full justify-start text-left" onClick={() => addNode("default", "Slack Notify")}>
            Slack Notify
          </Button>
        </div>

        <div className="space-y-2 mt-4">
          <Label className="text-xs text-muted-foreground uppercase">Logic</Label>
          <Button variant="outline" className="w-full justify-start text-left" onClick={() => addNode("default", "Condition")}>
            Condition (If/Else)
          </Button>
          <Button variant="outline" className="w-full justify-start text-left" onClick={() => addNode("default", "Delay")}>
            Delay
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between bg-background">
          <Input 
            value={workflowName} 
            onChange={(e) => setWorkflowName(e.target.value)} 
            className="w-64 font-semibold text-lg border-transparent hover:border-input focus:border-input"
          />
          <div className="space-x-2">
            <Button variant="outline">Test Execution</Button>
            <Button onClick={handleSave}>Save Workflow</Button>
          </div>
        </div>
        
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background gap={12} size={1} />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
