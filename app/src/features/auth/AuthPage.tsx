import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type AuthUser = {
  id: string;
  email?: string;
};

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser({
          id: user.id,
          email: user.email,
        });
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignUp() {
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username: email.split("@")[0],
      });

      if (profileError) {
        setMessage(profileError.message);
        return;
      }
    }

    setMessage("User created.");
  }

  async function handleLogin() {
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Logged in.");
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Logged out.");
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "420px", margin: "0 auto" }}>
      <h1>Auth</h1>

      {user ? (
        <div style={{ display: "grid", gap: "1rem" }}>
          <p>Logged in as: {user.email}</p>
          <button onClick={handleLogout}>Log out</button>
          {message && <p>{message}</p>}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleSignUp}>Sign up</button>
          <button onClick={handleLogin}>Log in</button>

          {message && <p>{message}</p>}
        </div>
      )}
    </main>
  );
}
