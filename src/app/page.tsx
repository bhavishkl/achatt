import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white gap-4">
      <h1 className="text-2xl font-bold">Welcome to Presently</h1>
      <Link href="/attendance" className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
        Go to Attendance Dashboard
      </Link>
    </main>
  );
}
