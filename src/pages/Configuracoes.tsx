import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Lock, Bell, Save, Loader2, Eye, EyeOff, Check, Camera, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SectionContainer from "@/components/dashboard/SectionContainer";

/* ── Notification preferences (localStorage) ── */
type NotifPrefs = {
  emailProcessing: boolean;
  emailErrors: boolean;
  browserAlerts: boolean;
};

const DEFAULT_NOTIFS: NotifPrefs = {
  emailProcessing: true,
  emailErrors: true,
  browserAlerts: false,
};

function loadNotifPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem("rf_notif_prefs");
    if (raw) return { ...DEFAULT_NOTIFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_NOTIFS;
}

function saveNotifPrefs(prefs: NotifPrefs) {
  localStorage.setItem("rf_notif_prefs", JSON.stringify(prefs));
}

/* ── Toggle component ── */
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition-colors duration-200 ${
        checked
          ? "border-primary/30 bg-primary"
          : "border-border bg-muted"
      }`}
    >
      <div
        className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-foreground shadow-sm transition-[left] duration-200"
        style={{ left: checked ? 23 : 3 }}
      />
    </button>
  );
}

/* ── Helper: get initials ── */
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (email || "U").slice(0, 2).toUpperCase();
}

/* ── Main ── */
const Configuracoes = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Notifications state
  const [notifs, setNotifs] = useState<NotifPrefs>(loadNotifPrefs);
  const [notifSaved, setNotifSaved] = useState(false);

  // Load profile
  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    supabase
      .from("profiles")
      .select("full_name, display_name, email, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name || "");
          setDisplayName(data.display_name || "");
          setProfileEmail(data.email || user.email || "");
          setAvatarUrl(data.avatar_url || null);
        }
        setProfileLoading(false);
      });
  }, [user]);

  // Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem (PNG ou JPG)", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "A imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }

    setPendingAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const cancelAvatarPreview = () => {
    setPendingAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Upload avatar to storage
  const uploadAvatar = async (): Promise<string | null> => {
    if (!pendingAvatarFile || !user) return avatarUrl;

    setAvatarUploading(true);
    try {
      const ext = pendingAvatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, pendingAvatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const url = publicData.publicUrl + `?t=${Date.now()}`;
      setAvatarUrl(url);
      setAvatarPreview(null);
      setPendingAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return url;
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: err.message, variant: "destructive" });
      return avatarUrl;
    } finally {
      setAvatarUploading(false);
    }
  };

  // Save profile (includes avatar upload if pending)
  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);

    let finalAvatarUrl = avatarUrl;
    if (pendingAvatarFile) {
      finalAvatarUrl = await uploadAvatar();
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        display_name: displayName.trim() || fullName.trim(),
        avatar_url: finalAvatarUrl,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro ao salvar perfil", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado com sucesso" });
    }
    setProfileSaving(false);
  };

  // Change password
  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast({ title: "Digite a nova senha", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha alterada com sucesso" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  };

  // Save notifications
  const handleNotifChange = (key: keyof NotifPrefs, val: boolean) => {
    const updated = { ...notifs, [key]: val };
    setNotifs(updated);
    saveNotifPrefs(updated);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  const initials = getInitials(fullName || displayName, profileEmail);
  const displayedAvatar = avatarPreview || avatarUrl;

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[720px]">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-8"
        >
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seu perfil, senha e preferências do sistema.
          </p>
        </motion.div>

        <div className="space-y-5">
          {/* ── Profile ── */}
          <SectionContainer delay={0.05}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-[18px] w-[18px] text-primary" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Perfil</p>
                <p className="text-[13px] text-muted-foreground">
                  Informações pessoais da sua conta
                </p>
              </div>
            </div>

            {profileLoading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              <div className="space-y-5">
                {/* ── Avatar upload ── */}
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border-2 border-border bg-muted transition-shadow duration-200 hover:shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]">
                      {displayedAvatar ? (
                        <img
                          src={displayedAvatar}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[22px] font-bold text-primary tracking-wider">
                          {initials}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg flex items-center justify-center bg-primary border-2 border-background transition-transform duration-150 hover:scale-110"
                      title="Alterar foto"
                    >
                      <Camera className="h-[13px] w-[13px] text-primary-foreground" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Foto de perfil</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG ou WebP. Máximo 5MB.
                    </p>
                    {avatarPreview && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          Preview — salve para aplicar
                        </span>
                        <button
                          type="button"
                          onClick={cancelAvatarPreview}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Cancelar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Name fields ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-muted-foreground">Nome completo</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="h-[42px] w-full rounded-xl border border-border bg-muted px-3.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-semibold text-muted-foreground">Nome de exibição</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Como deseja ser chamado"
                      className="h-[42px] w-full rounded-xl border border-border bg-muted px-3.5 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    />
                    <p className="text-[11px] text-muted-foreground/70">
                      Este será o nome principal exibido no sistema.
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    disabled
                    className="h-[42px] w-full rounded-xl border border-border bg-muted px-3.5 text-sm text-foreground outline-none opacity-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground/70">
                    O email não pode ser alterado por aqui.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={profileSaving || avatarUploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profileSaving || avatarUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar perfil
                  </button>
                </div>
              </div>
            )}
          </SectionContainer>

          {/* ── Password ── */}
          <SectionContainer delay={0.1}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
                <Lock className="h-[18px] w-[18px] text-accent-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">Alterar senha</p>
                <p className="text-[13px] text-muted-foreground">
                  Defina uma nova senha para sua conta
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-muted-foreground">Nova senha</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="h-[42px] w-full rounded-xl border border-border bg-muted px-3.5 pr-11 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-muted-foreground">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="h-[42px] w-full rounded-xl border border-border bg-muted px-3.5 pr-11 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive mt-1">As senhas não coincidem.</p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={passwordSaving || !newPassword || newPassword !== confirmPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Alterar senha
                </button>
              </div>
            </div>
          </SectionContainer>

          {/* ── Notifications ── */}
          <SectionContainer delay={0.15}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
                <Bell className="h-[18px] w-[18px] text-success-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-foreground">Notificações</p>
                <p className="text-[13px] text-muted-foreground">
                  Controle os alertas e avisos do sistema
                </p>
              </div>
              {notifSaved && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-success-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                  Salvo
                </motion.span>
              )}
            </div>

            <div className="space-y-1">
              {([
                {
                  key: "emailProcessing" as const,
                  label: "Conclusão de processamento",
                  desc: "Receba um aviso quando uma conciliação terminar",
                },
                {
                  key: "emailErrors" as const,
                  label: "Erros e falhas",
                  desc: "Seja notificado sobre erros durante o processamento",
                },
                {
                  key: "browserAlerts" as const,
                  label: "Alertas no navegador",
                  desc: "Exibir notificações push no navegador",
                },
              ]).map(({ key, label, desc }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 py-3.5 px-1 border-b border-border/50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <Toggle checked={notifs[key]} onChange={(val) => handleNotifChange(key, val)} />
                </div>
              ))}
            </div>
          </SectionContainer>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
