import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Hexagon, Lock, Eye, EyeOff, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Step = "loading" | "sending-code" | "verify-code" | "set-password" | "done";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const hasTriggeredVerificationRef = useRef(false);

  const sendVerificationCode = useCallback(async () => {
    if (hasTriggeredVerificationRef.current) return;
    hasTriggeredVerificationRef.current = true;
    setStep("sending-code");
    const { error } = await supabase.auth.reauthenticate();
    if (error) {
      hasTriggeredVerificationRef.current = false;
      console.error("Reauthenticate error:", error);
      toast({
        title: "Erro ao enviar código",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setStep("verify-code");
    toast({
      title: "Código enviado!",
      description: "Verifique seu email para o código de verificação.",
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setEmail(session.user.email || "");
          if (
            !hasTriggeredVerificationRef.current &&
            (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION")
          ) {
            await sendVerificationCode();
          }
        } else if (!hasTriggeredVerificationRef.current) {
          // No session — invalid or expired link
          toast({
            title: "Link inválido ou expirado",
            description: "Solicite um novo convite ou link de recuperação.",
            variant: "destructive",
          });
          navigate("/login", { replace: true });
        }
      }
    );

    // Also check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setEmail(session.user.email || "");
        if (!hasTriggeredVerificationRef.current) {
          await sendVerificationCode();
        }
      } else if (!hasTriggeredVerificationRef.current) {
        toast({
          title: "Link inválido ou expirado",
          description: "Solicite um novo convite ou link de recuperação.",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, sendVerificationCode]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    // Code is valid — proceed to password step
    // The nonce will be sent with updateUser
    setStep("set-password");
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password,
      nonce: otpCode,
    });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("nonce") || error.message.toLowerCase().includes("otp")) {
        toast({
          title: "Código inválido",
          description: "O código de verificação está incorreto ou expirou. Tente novamente.",
          variant: "destructive",
        });
        setOtpCode("");
        setStep("verify-code");
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    } else {
      setStep("done");
      toast({
        title: "Senha definida com sucesso!",
        description: "Você será redirecionado ao painel.",
      });
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    }
  };

  const handleResendCode = async () => {
    hasTriggeredVerificationRef.current = false;
    setOtpCode("");
    await sendVerificationCode();
  };

  const stepVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#18181A" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: "#412402" }}>
            <Hexagon className="h-6 w-6" style={{ color: "#BA7517" }} />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "#F5F5F0" }}>
            Receita<span style={{ color: "#FAC775" }}>Flow</span>
          </h1>
        </div>

        <div className="card-elevated p-6">
          <AnimatePresence mode="wait">
            {/* Step: Loading / Sending Code */}
            {(step === "loading" || step === "sending-code") && (
              <motion.div
                key="loading"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#BA7517" }} />
                <p className="text-sm" style={{ color: "#888780" }}>
                  {step === "loading" ? "Verificando sessão..." : "Enviando código de verificação..."}
                </p>
              </motion.div>
            )}

            {/* Step: Verify Code */}
            {step === "verify-code" && (
              <motion.div
                key="verify"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <div className="flex flex-col items-center mb-6">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "rgba(186, 117, 23, 0.15)" }}
                  >
                    <Mail className="h-6 w-6" style={{ color: "#BA7517" }} />
                  </div>
                  <h2 className="text-lg font-semibold text-center mb-1" style={{ color: "#F5F5F0" }}>
                    Verifique seu email
                  </h2>
                  <p className="text-xs text-center" style={{ color: "#888780" }}>
                    Enviamos um código de 6 dígitos para
                  </p>
                  <p className="text-xs text-center font-medium mt-1" style={{ color: "#FAC775" }}>
                    {email}
                  </p>
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(value) => setOtpCode(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <span className="mx-2" style={{ color: "#5F5E5A" }}>-</span>
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-btn border-0 h-10 text-sm"
                    disabled={otpCode.length !== 6}
                  >
                    Verificar código
                  </Button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="w-full text-xs text-center py-2 transition-colors"
                    style={{ color: "#888780" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FAC775")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#888780")}
                  >
                    Não recebeu? Reenviar código
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step: Set Password */}
            {step === "set-password" && (
              <motion.div
                key="password"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
              >
                <div className="flex flex-col items-center mb-6">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "rgba(186, 117, 23, 0.15)" }}
                  >
                    <ShieldCheck className="h-6 w-6" style={{ color: "#BA7517" }} />
                  </div>
                  <h2 className="text-lg font-semibold text-center mb-1" style={{ color: "#F5F5F0" }}>
                    Defina sua senha
                  </h2>
                  <p className="text-xs text-center" style={{ color: "#888780" }}>
                    Email verificado! Agora crie sua senha de acesso.
                  </p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[11px]" style={{ color: "#5F5E5A" }}>Nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#5F5E5A" }} />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 border-[#2C2C2A] bg-[#18181A] h-10"
                        style={{ color: "#B4B2A9" }}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "#5F5E5A" }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-btn border-0 h-10 text-sm"
                    disabled={loading}
                  >
                    {loading ? "Salvando..." : "Definir senha"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Step: Done */}
            {step === "done" && (
              <motion.div
                key="done"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(34, 197, 94, 0.15)" }}
                >
                  <ShieldCheck className="h-6 w-6" style={{ color: "#22c55e" }} />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: "#F5F5F0" }}>Tudo pronto!</h2>
                <p className="text-xs text-center" style={{ color: "#888780" }}>
                  Sua conta foi ativada. Redirecionando...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
