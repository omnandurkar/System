'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signupUser } from '@/app/auth-actions';
import Link from 'next/link';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-foreground py-2 font-medium text-background transition-colors hover:bg-muted-foreground disabled:opacity-50"
        >
            {pending ? 'INITIALIZING...' : 'CREATE IDENTITY'}
        </button>
    );
}

export default function SignupPage() {
    const [state, action] = useActionState(signupUser, null);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-sm space-y-8 text-center">
                <h1 className="text-4xl font-bold tracking-tighter">INITIATION</h1>
                <p className="text-muted-foreground">Begin your protocol.</p>

                <form action={action} className="space-y-4 text-left">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Username</label>
                        <input
                            name="username"
                            type="text"
                            required
                            className="w-full rounded border border-input bg-card px-3 py-2 focus:border-foreground focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full rounded border border-input bg-card px-3 py-2 focus:border-foreground focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Confirm Password</label>
                        <input
                            name="confirm"
                            type="password"
                            required
                            className="w-full rounded border border-input bg-card px-3 py-2 focus:border-foreground focus:outline-none"
                        />
                    </div>

                    {state?.error && (
                        <p className="text-sm text-red-500">{state.error}</p>
                    )}

                    <SubmitButton />
                </form>

                <div className="text-sm text-muted-foreground">
                    Existing Unit? <Link href="/login" className="text-foreground underline">Access System</Link>
                </div>
            </div>
        </div>
    );
}
