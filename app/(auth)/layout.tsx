import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-12">
      <div className="mb-10">
        <span className="text-[1.125rem] font-extrabold tracking-[0.18em] text-text-primary select-none">
          TRAILBLAZER
        </span>
      </div>
      <div className="w-full max-w-[440px]">{children}</div>
    </div>
  );
}
