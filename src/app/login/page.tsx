export const dynamic = 'force-dynamic';

import AuthForm from "@/components/Auth/AuthForm";
import styles from "./page.module.css";
import Link from "next/link";

export default function LoginPage() {
    return (
        <main className={styles.main}>
            <div className={styles.header}>
                <Link href="/" className={styles.brand}>Zizzy</Link>
            </div>
            <AuthForm />
        </main>
    );
}
