export default function UnauthorizedPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
      <h1 className="text-4xl font-semibold text-red-600">Access Denied</h1>
      <p className="max-w-md text-gray-600">
        You do not have the required permissions to access this section of the EXPERT POS application. If you
        believe this is an error, please contact an administrator.
      </p>
      <a
        href="/dashboard"
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white shadow hover:bg-blue-500"
      >
        Back to Dashboard
      </a>
    </div>
  );
}
