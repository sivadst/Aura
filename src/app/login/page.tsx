import { LoginButton } from "@/components/auth/login-button";

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 text-center p-8 border rounded-xl shadow-sm bg-card">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Aura</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>
        <LoginButton />
      </div>
    </div>
  );
}
