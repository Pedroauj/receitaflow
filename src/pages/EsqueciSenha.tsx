import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Hexagon, Mail, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const APP_URL = "https://receitaflow.com";

const EsqueciSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${APP_URL}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0d16]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-violet-500/15">
            <Hexagon className="h-6 w-6 text-violet-400" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Receita<span className="text-violet-400">Flow</span>
          </h1>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,18,30,0.97),rgba(10,12,22,0.99))] shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-violet-500/15">
                <Mail className="h-6 w-6 text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-foreground">Email enviado!</h2>
              <p className="text-xs text-muted-foreground">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-center mb-1 text-foreground">Esqueceu a senha?</h2>
              <p className="text-xs text-center mb-6 text-muted-foreground">
                Informe seu email e enviaremos um link para redefinir sua senha.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 border-white/8 bg-white/[0.04] h-10" required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[linear-gradient(135deg,rgba(99,102,241,0.9),rgba(139,92,246,0.8))] border-0 text-white shadow-[0_12px_28px_rgba(99,102,241,0.25)] hover:opacity-95 h-10 text-sm" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-5">
          <Link to="/login" className="font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Voltar ao login
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default EsqueciSenha;
