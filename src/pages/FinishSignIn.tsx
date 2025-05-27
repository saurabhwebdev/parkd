import FinishSignIn from "@/components/auth/FinishSignIn";

export default function FinishSignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">ParkD</h1>
          <p className="mt-2 text-muted-foreground">Completing sign in</p>
        </div>
        <FinishSignIn />
      </div>
    </div>
  );
} 