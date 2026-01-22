"use client";

import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import styles from './AuthForm.module.css';
import { useRouter } from 'next/navigation';

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!isSupabaseConfigured) {
            setError("Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.refresh();
                router.push('/');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                // Maybe auto login or show check email message
                if (!error) {
                    // For simplicity, just tell them to check email or log them in if auto-confirm is on
                    // Often supabase requires email confirmation by default.
                    // We'll assume for now we might want to just show a message.
                    router.refresh();
                    alert("Check your email for the confirmation link!");
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
            <p className={styles.subtitle}>
                {isLogin ? 'Enter your credentials to access your account' : 'Enter your email to get started'}
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleAuth} className={styles.form}>
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        placeholder="name@example.com"
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.input}
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                </div>

                <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>
            </form>

            <div className={styles.toggleText}>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className={styles.link}
                >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
            </div>
        </div>
    );
}
