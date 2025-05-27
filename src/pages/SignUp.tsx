import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUp() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">ParkD</h1>
          <p className="mt-2 text-muted-foreground">Create a new account</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
} 