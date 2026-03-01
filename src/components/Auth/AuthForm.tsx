"use client";

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import styles from './AuthForm.module.css';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthForm() {
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nickname, setNickname] = useState('');
    const router = useRouter();

    useEffect(() => {
        if (mode === 'signup') {
            setIsLogin(false);
        }
    }, [mode]);

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
                // Sign up with nickname as display name
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: nickname } }
                });
                if (error) throw error;
                // Redirect after signup
                setTimeout(() => {
                    router.refresh();
                    router.push('/');
                }, 1800);
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
                {!isLogin && (
                    <div className={styles.inputGroup}>
                        <label className={styles.label} htmlFor="nickname">Nickname</label>
                        <input
                            id="nickname"
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className={styles.input}
                            placeholder="How should we call you?"
                            required
                            minLength={2}
                        />
                    </div>
                )}

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

            {/* Onboarding pop-up removed */}
        </div>
    );
}
