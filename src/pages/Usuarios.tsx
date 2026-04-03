import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Users,
  Shield,
  ShieldOff,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  Pencil,
  LayoutDashboard,
  History,
  Loader2,
  FileSearch,
  Building2,
  Settings,
  Fuel,
  BarChart3,
  Plus,
  Upload,
  X,
  ImageIcon,
  Mail,
  UserPlus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
  company_id: string | null;
}

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  active: boolean;
  created_at: string;
}

interface ModulePermission {
  id: string;
  user_id: string;
  module_key: string;
  can_view: boolean;
  can_edit: boolean;
}

const MODULES = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "historico", label: "Histórico", icon: History },
  { key: "conciliacao", label: "NF-e / NFS-e", icon: FileSearch },
  { key: "contas-a-pagar", label: "Contas a Pagar", icon: Landmark },
  { key: "abastecimento", label: "Abastecimento", icon: Fuel },
  { key: "medias-abastecimento", label: "Médias de Abastecimento", icon: BarChart3 },
  { key: "clientes", label: "Clientes", icon: Building2 },
  { key: "configuracoes", label: "Configurações", icon: Settings },
];

const Usuarios = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, ModulePermission[]>>({});
  const [permLoading, setPermLoading] = useState<string | null>(null);

  // Company creation
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyLogo, setNewCompanyLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [creatingCompany, setCreatingCompany] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCompany, setInviteCompany] = useState("");
  const [inviting, setInviting] = useState(false);

  // Edit company
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editCompanyLogo, setEditCompanyLogo] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete company
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Delete user
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [deletingUserLoading, setDeletingUserLoading] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<"users" | "companies">("users");

  useEffect(() => {
    checkMasterAndLoad();
  }, [user]);

  const checkMasterAndLoad = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "master") {
      setIsMaster(false);
      setLoading(false);
      return;
    }

    setIsMaster(true);
    await Promise.all([loadProfiles(), loadCompanies()]);
  };

  const loadProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProfiles((data as Profile[]) || []);
    }
    setLoading(false);
  };

  const loadCompanies = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setCompanies(data || []);
  };

  const loadPermissions = async (userId: string) => {
    if (permissions[userId]) return;
    setPermLoading(userId);

    const { data, error } = await supabase
      .from("user_module_permissions")
      .select("*")
      .eq("user_id", userId);

    if (!error) {
      setPermissions((prev) => ({ ...prev, [userId]: data || [] }));
    }
    setPermLoading(null);
  };

  const toggleExpand = async (profile: Profile) => {
    if (expandedUser === profile.user_id) {
      setExpandedUser(null);
    } else {
      setExpandedUser(profile.user_id);
      await loadPermissions(profile.user_id);
    }
  };

  const togglePermission = async (
    userId: string,
    moduleKey: string,
    field: "can_view" | "can_edit",
  ) => {
    const userPerms = permissions[userId] || [];
    const existing = userPerms.find((p) => p.module_key === moduleKey);

    if (existing) {
      const newVal = !existing[field];
      const updates: Partial<ModulePermission> =
        field === "can_view" && !newVal
          ? { can_view: false, can_edit: false }
          : { [field]: newVal };

      const { error } = await supabase
        .from("user_module_permissions")
        .update(updates)
        .eq("id", existing.id);

      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }

      setPermissions((prev) => ({
        ...prev,
        [userId]: prev[userId].map((p) =>
          p.id === existing.id ? { ...p, ...updates } : p,
        ),
      }));
    } else {
      const newPerm = {
        user_id: userId,
        module_key: moduleKey,
        can_view: field === "can_view",
        can_edit: field === "can_edit",
      };

      const { data, error } = await supabase
        .from("user_module_permissions")
        .insert(newPerm)
        .select()
        .single();

      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }

      setPermissions((prev) => ({
        ...prev,
        [userId]: [...(prev[userId] || []), data],
      }));
    }
  };

  const toggleRole = async (profile: Profile) => {
    if (profile.email === "pedraljoao5@gmail.com") return;
    setUpdating(profile.id);

    const newRole = profile.role === "master" ? "user" : "master";
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p)),
      );
      toast({
        title: `Papel alterado para ${newRole === "master" ? "Admin" : "Usuário"}`,
      });
    }

    setUpdating(null);
  };

  const toggleActive = async (profile: Profile) => {
    if (profile.email === "pedraljoao5@gmail.com") return;
    setUpdating(profile.id);

    const { error } = await supabase
      .from("profiles")
      .update({ active: !profile.active })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, active: !p.active } : p)),
      );
      toast({ title: profile.active ? "Usuário desativado" : "Usuário ativado" });
    }

    setUpdating(null);
  };

  const assignCompany = async (profile: Profile, companyId: string | null) => {
    setUpdating(profile.id);

    const { error } = await supabase
      .from("profiles")
      .update({ company_id: companyId || null } as any)
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, company_id: companyId } : p)),
      );
      toast({ title: companyId ? "Empresa vinculada" : "Empresa removida" });
    }

    setUpdating(null);
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewCompanyLogo(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const createCompany = async () => {
    if (!newCompanyName.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }

    setCreatingCompany(true);

    let logoUrl: string | null = null;

    if (newCompanyLogo) {
      const ext = newCompanyLogo.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(path, newCompanyLogo);

      if (uploadError) {
        toast({
          title: "Erro ao enviar logo",
          description: uploadError.message,
          variant: "destructive",
        });
        setCreatingCompany(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(path);

      logoUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("companies")
      .insert({ name: newCompanyName.trim(), logo_url: logoUrl });

    if (error) {
      toast({
        title: "Erro ao criar empresa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Empresa criada!" });
      setNewCompanyName("");
      setNewCompanyLogo(null);
      setLogoPreview(null);
      setShowNewCompany(false);
      await loadCompanies();
    }

    setCreatingCompany(false);
  };

  const startEditCompany = (company: Company) => {
    setEditingCompany(company);
    setEditCompanyName(company.name);
    setEditLogoPreview(company.logo_url);
    setEditCompanyLogo(null);
  };

  const handleEditLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditCompanyLogo(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const saveCompany = async () => {
    if (!editingCompany || !editCompanyName.trim()) return;
    setSavingCompany(true);

    let logoUrl = editingCompany.logo_url;

    if (editCompanyLogo) {
      const ext = editCompanyLogo.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(path, editCompanyLogo);

      if (uploadError) {
        toast({
          title: "Erro ao enviar logo",
          description: uploadError.message,
          variant: "destructive",
        });
        setSavingCompany(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(path);

      logoUrl = urlData.publicUrl;
    } else if (editLogoPreview === null) {
      logoUrl = null;
    }

    const { error } = await supabase
      .from("companies")
      .update({ name: editCompanyName.trim(), logo_url: logoUrl })
      .eq("id", editingCompany.id);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Empresa atualizada!" });
      setEditingCompany(null);
      await loadCompanies();
    }

    setSavingCompany(false);
  };

  const deleteCompany = async () => {
    if (!deletingCompany) return;
    setDeleting(true);

    const { error: unlinkError } = await supabase
      .from("profiles")
      .update({ company_id: null } as any)
      .eq("company_id", deletingCompany.id);

    if (unlinkError) {
      toast({
        title: "Erro ao desvincular usuários",
        description: unlinkError.message,
        variant: "destructive",
      });
      setDeleting(false);
      return;
    }

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", deletingCompany.id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Empresa excluída!" });
      setDeletingCompany(null);
      setConfirmDeleteName("");
      await Promise.all([loadCompanies(), loadProfiles()]);
    }

    setDeleting(false);
  };

  const deleteUser = async () => {
    if (!deletingUser) return;
    setDeletingUserLoading(true);

    const { data, error } = await supabase.functions.invoke("delete-user", {
      body: { user_id: deletingUser.user_id },
    });

    if (error || data?.error) {
      toast({
        title: "Erro ao excluir usuário",
        description: data?.error || error?.message || "Erro desconhecido",
        variant: "destructive",
      });
    } else {
      toast({ title: "Usuário excluído com sucesso!" });
      setProfiles((prev) => prev.filter((p) => p.id !== deletingUser.id));
      setDeletingUser(null);
    }

    setDeletingUserLoading(false);
  };

  const inviteUser = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast({ title: "Email inválido", variant: "destructive" });
      return;
    }

    setInviting(true);

    const { data, error } = await supabase.functions.invoke("invite-user", {
      body: { email: inviteEmail.trim(), company_id: inviteCompany || null },
    });

    if (error || data?.error) {
      toast({
        title: "Erro ao convidar",
        description: data?.error || error?.message || "Erro desconhecido",
        variant: "destructive",
      });
    } else {
      toast({
        title: data?.resent ? "Convite reenviado!" : "Convite enviado!",
        description: `Email enviado para ${inviteEmail.trim()}`,
      });
      setInviteEmail("");
      setInviteCompany("");
      setShowInvite(false);
      setTimeout(() => loadProfiles(), 2000);
    }

    setInviting(false);
  };

  if (isMaster === false) return <Navigate to="/dashboard" replace />;

  const filtered = profiles.filter(
    (p) =>
      (p.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.display_name?.toLowerCase() || "").includes(search.toLowerCase()),
  );

  const getPermission = (userId: string, moduleKey: string) => {
    return (permissions[userId] || []).find((p) => p.module_key === moduleKey);
  };

  return (
    <div className="relative space-y-6">
      {/* Styles moved to Tailwind utilities below */}

      <div className="rf-users-shell">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="rfu-panel rounded-[24px] p-5 md:p-6"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">
                <Shield className="h-3.5 w-3.5" />
                Painel administrativo
              </div>

              <div>
                <h1 className="text-[24px] font-black tracking-[-0.04em] text-white md:text-[30px]">
                  Gestão de Usuários
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/52">
                  Gerencie empresas, permissões, convites e acessos dos usuários do sistema
                  dentro de uma única central administrativa.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rfu-stat">{profiles.length} usuários cadastrados</div>
              <div className="rfu-stat">{companies.length} empresas</div>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-full border border-white/8 bg-white/[0.025] p-1.5 w-fit">
          <button
            onClick={() => setActiveTab("users")}
            className={`rfu-tab ${activeTab === "users" ? "is-active" : ""}`}
            type="button"
          >
            <Users className="h-3.5 w-3.5" />
            Usuários
          </button>

          <button
            onClick={() => setActiveTab("companies")}
            className={`rfu-tab ${activeTab === "companies" ? "is-active" : ""}`}
            type="button"
          >
            <Building2 className="h-3.5 w-3.5" />
            Empresas
          </button>
        </div>

        {activeTab === "companies" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
            className="mt-6 space-y-4"
          >
            <div className="rfu-glass rounded-[22px] p-4 md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Empresas cadastradas</p>
                  <p className="mt-1 text-xs text-white/46">
                    Organize seus usuários por empresa e gerencie identidade visual.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-white/46">
                    {companies.length} empresa{companies.length !== 1 ? "s" : ""}
                  </span>

                  <button
                    type="button"
                    className="rfu-btn-primary"
                    onClick={() => setShowNewCompany(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Nova empresa
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showNewCompany && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="rfu-glass rounded-[22px] p-5 md:p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">Nova empresa</h3>
                        <p className="mt-1 text-xs text-white/44">
                          Cadastre uma nova empresa e opcionalmente defina a logo.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCompany(false);
                          setLogoPreview(null);
                          setNewCompanyLogo(null);
                        }}
                        className="rfu-mini-btn px-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                          Nome da empresa
                        </Label>
                        <Input
                          value={newCompanyName}
                          onChange={(e) => setNewCompanyName(e.target.value)}
                          placeholder="Ex: FinBrasil"
                          className="rfu-input h-10 border-0 bg-transparent text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                          Logo da empresa
                        </Label>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoSelect}
                          className="hidden"
                        />

                        {logoPreview ? (
                          <div className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-white/[0.025] p-3">
                            <div className="h-14 w-24 rounded-xl border border-white/8 bg-black/20 flex items-center justify-center overflow-hidden">
                              <img
                                src={logoPreview}
                                alt="Preview"
                                className="h-full object-contain"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setNewCompanyLogo(null);
                                setLogoPreview(null);
                              }}
                              className="rfu-btn-ghost"
                            >
                              Remover
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-14 w-full items-center gap-2 rounded-[16px] border border-dashed border-white/10 bg-white/[0.025] px-4 text-sm font-medium text-white/56 transition-colors hover:bg-white/[0.04] hover:text-white/82"
                          >
                            <Upload className="h-4 w-4" />
                            Fazer upload do logo
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="rfu-btn-primary"
                        onClick={createCompany}
                        disabled={creatingCompany}
                      >
                        {creatingCompany ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Criar empresa
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rfu-panel rounded-[22px] overflow-hidden">
              <div className="divide-y divide-white/6">
                {companies.map((company) => {
                  const userCount = profiles.filter((p) => p.company_id === company.id).length;

                  return (
                    <div
                      key={company.id}
                      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-white/8 bg-white/[0.03]">
                        {company.logo_url ? (
                          <img
                            src={company.logo_url}
                            alt={company.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-white/34" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {company.name}
                        </p>
                        <p className="mt-1 text-[11px] text-white/42">
                          {userCount} usuário{userCount !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startEditCompany(company)}
                          className="rfu-mini-btn"
                          title="Editar empresa"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingCompany(company)}
                          className="rfu-mini-btn border-red-500/20 bg-red-500/[0.06] text-red-300 hover:bg-red-500/[0.12] hover:text-red-200"
                          title="Excluir empresa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {companies.length === 0 && (
                  <div className="px-5 py-14 text-center">
                    <p className="text-sm font-medium text-white/78">
                      Nenhuma empresa cadastrada.
                    </p>
                    <p className="mt-1 text-xs text-white/42">
                      Crie a primeira empresa para começar a organizar os usuários.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {editingCompany && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rfu-modal-backdrop fixed inset-0 z-50 flex items-center justify-center px-4"
                  onClick={() => setEditingCompany(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{ duration: 0.18 }}
                    className="rfu-modal w-full max-w-md rounded-[24px] p-6 space-y-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">Editar empresa</h3>
                        <p className="mt-1 text-xs text-white/42">
                          Atualize o nome e a logo da empresa.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingCompany(null)}
                        className="rfu-mini-btn px-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                        Nome
                      </Label>
                      <Input
                        value={editCompanyName}
                        onChange={(e) => setEditCompanyName(e.target.value)}
                        className="rfu-input h-10 border-0 bg-transparent text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                        Logo
                      </Label>

                      <input
                        ref={editFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleEditLogoSelect}
                        className="hidden"
                      />

                      {editLogoPreview ? (
                        <div className="flex items-center gap-3 rounded-[16px] border border-white/8 bg-white/[0.025] p-3">
                          <div className="h-14 w-24 rounded-xl border border-white/8 bg-black/20 flex items-center justify-center overflow-hidden">
                            <img
                              src={editLogoPreview}
                              alt="Preview"
                              className="h-full object-contain"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditCompanyLogo(null);
                              setEditLogoPreview(null);
                            }}
                            className="rfu-btn-ghost"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="flex h-14 w-full items-center gap-2 rounded-[16px] border border-dashed border-white/10 bg-white/[0.025] px-4 text-sm font-medium text-white/56 transition-colors hover:bg-white/[0.04] hover:text-white/82"
                        >
                          <Upload className="h-4 w-4" />
                          Fazer upload do logo
                        </button>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        className="rfu-btn-ghost"
                        onClick={() => setEditingCompany(null)}
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        className="rfu-btn-primary"
                        onClick={saveCompany}
                        disabled={savingCompany || !editCompanyName.trim()}
                      >
                        {savingCompany ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          "Salvar"
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {deletingCompany && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rfu-modal-backdrop fixed inset-0 z-50 flex items-center justify-center px-4"
                  onClick={() => {
                    setDeletingCompany(null);
                    setConfirmDeleteName("");
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{ duration: 0.18 }}
                    className="rfu-modal w-full max-w-sm rounded-[24px] p-6 space-y-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <h3 className="text-base font-bold text-white">Excluir empresa</h3>
                      <p className="mt-2 text-xs leading-relaxed text-white/46">
                        Esta ação é irreversível. Todos os usuários vinculados a{" "}
                        <span className="font-semibold text-white">
                          {deletingCompany.name}
                        </span>{" "}
                        serão desvinculados.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                        Digite {deletingCompany.name} para confirmar
                      </Label>
                      <Input
                        value={confirmDeleteName}
                        onChange={(e) => setConfirmDeleteName(e.target.value)}
                        placeholder={deletingCompany.name}
                        className="rfu-input h-10 border-0 bg-transparent text-sm"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        className="rfu-btn-ghost"
                        onClick={() => {
                          setDeletingCompany(null);
                          setConfirmDeleteName("");
                        }}
                      >
                        Cancelar
                      </button>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-[38px] rounded-full px-4 text-xs font-bold"
                        onClick={deleteCompany}
                        disabled={deleting || confirmDeleteName !== deletingCompany.name}
                      >
                        {deleting ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          "Excluir empresa"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === "users" && (
          <div className="mt-6 space-y-4">
            <div className="rfu-glass rounded-[22px] p-4 md:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative w-full max-w-md">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rfu-search w-full pl-11 pr-4 text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-white/46">
                    {filtered.length} usuário{filtered.length !== 1 ? "s" : ""}
                  </span>

                  <button
                    type="button"
                    className="rfu-btn-primary"
                    onClick={() => setShowInvite(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Convidar
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showInvite && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="rfu-glass rounded-[22px] p-5 md:p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="flex items-center gap-2 text-base font-bold text-white">
                          <Mail className="h-4 w-4 text-violet-300" />
                          Convidar usuário
                        </h3>
                        <p className="mt-1 text-xs text-white/42">
                          Envie um convite e associe o usuário a uma empresa, se necessário.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowInvite(false)}
                        className="rfu-mini-btn px-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                          Email do convidado
                        </Label>
                        <Input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="email@empresa.com"
                          className="rfu-input h-10 border-0 bg-transparent text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/42">
                          Empresa (opcional)
                        </Label>
                        <select
                          value={inviteCompany}
                          onChange={(e) => setInviteCompany(e.target.value)}
                          className="rfu-native-select w-full px-3 text-sm"
                        >
                          <option value="">Sem empresa</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-[11px] text-white/42">
                        O convite será enviado via{" "}
                        <span className="font-semibold text-white/80">
                          notify.receitaflow.com
                        </span>
                      </p>

                      <button
                        type="button"
                        className="rfu-btn-primary"
                        onClick={inviteUser}
                        disabled={inviting}
                      >
                        {inviting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Mail className="h-3.5 w-3.5" />
                            Enviar convite
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="rfu-panel rounded-[22px] py-20">
                <div className="flex items-center justify-center gap-3 text-white/54">
                  <div className="h-6 w-6 rounded-full border-2 border-violet-300/70 border-t-transparent animate-spin" />
                  <span className="text-sm font-medium">Carregando usuários...</span>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
                className="rfu-panel rounded-[22px] overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="rfu-table w-full">
                    <thead>
                      <tr className="border-b border-white/6">
                        <th className="w-8 px-2 py-4" />
                        <th className="px-4 py-4 text-left">Usuário</th>
                        <th className="px-4 py-4 text-left">Email</th>
                        <th className="px-4 py-4 text-left">Empresa</th>
                        <th className="px-4 py-4 text-center">Papel</th>
                        <th className="px-4 py-4 text-center">Status</th>
                        <th className="px-4 py-4 text-center">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((profile) => {
                        const isSelf = profile.email === "pedraljoao5@gmail.com";
                        const isExpanded = expandedUser === profile.user_id;
                        const initials = (profile.full_name || profile.display_name || profile.email || "U")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();

                        return (
                          <FragmentRow key={profile.id}>
                            <tr className="rfu-row border-b border-white/6 last:border-0">
                              <td className="px-2 py-3">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(profile)}
                                  className="rfu-mini-btn h-7 w-7 rounded-lg px-0"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/8 bg-violet-500/12 text-[11px] font-extrabold text-violet-200">
                                    {initials}
                                  </div>
                                  <span className="text-sm font-semibold text-white">
                                    {profile.full_name || profile.display_name || "—"}
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-sm text-white/56">
                                {profile.email || "—"}
                              </td>

                              <td className="px-4 py-3">
                                <select
                                  value={profile.company_id || ""}
                                  onChange={(e) => assignCompany(profile, e.target.value || null)}
                                  disabled={updating === profile.id}
                                  className="h-9 max-w-[180px] rounded-[12px] border border-white/8 bg-white/[0.03] px-3 text-[12px] font-medium text-white/84 outline-none transition-all focus:border-violet-400/40 focus:ring-4 focus:ring-violet-500/10 disabled:opacity-50"
                                >
                                  <option value="">Sem empresa</option>
                                  {companies.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`rfu-badge ${
                                    profile.role === "master"
                                      ? "bg-violet-500/14 text-violet-200"
                                      : "bg-white/[0.05] text-white/60"
                                  }`}
                                >
                                  {profile.role === "master" ? (
                                    <Shield className="h-3 w-3" />
                                  ) : (
                                    <Users className="h-3 w-3" />
                                  )}
                                  {profile.role === "master" ? "Admin" : "Usuário"}
                                </span>
                              </td>

                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`rfu-badge ${
                                    profile.active
                                      ? "bg-emerald-500/14 text-emerald-300"
                                      : "bg-red-500/14 text-red-300"
                                  }`}
                                >
                                  {profile.active ? "Ativo" : "Inativo"}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                {isSelf ? (
                                  <span className="flex justify-center text-[11px] font-semibold text-white/28">
                                    Protegido
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleRole(profile)}
                                      disabled={updating === profile.id}
                                      className="rfu-mini-btn"
                                      title={
                                        profile.role === "master"
                                          ? "Rebaixar para Usuário"
                                          : "Promover a Admin"
                                      }
                                    >
                                      {profile.role === "master" ? (
                                        <ShieldOff className="h-3.5 w-3.5" />
                                      ) : (
                                        <Shield className="h-3.5 w-3.5" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => toggleActive(profile)}
                                      disabled={updating === profile.id}
                                      className={`rfu-mini-btn ${
                                        profile.active
                                          ? "border-red-500/18 bg-red-500/[0.06] text-red-300 hover:bg-red-500/[0.12] hover:text-red-200"
                                          : "border-emerald-500/18 bg-emerald-500/[0.06] text-emerald-300 hover:bg-emerald-500/[0.12] hover:text-emerald-200"
                                      }`}
                                    >
                                      {profile.active ? "Desativar" : "Ativar"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setDeletingUser(profile)}
                                      disabled={updating === profile.id}
                                      className="rfu-mini-btn border-red-500/18 bg-red-500/[0.06] text-red-300 hover:bg-red-500/[0.12] hover:text-red-200"
                                      title="Excluir usuário"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>

                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={7} className="p-0">
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="border-b border-white/6 bg-white/[0.02] px-5 py-5 md:px-6">
                                        <div className="mb-4 flex items-center justify-between gap-4">
                                          <div>
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/38">
                                              Permissões por módulo
                                            </p>
                                            <p className="mt-1 text-xs text-white/42">
                                              Controle de visualização e edição por usuário.
                                            </p>
                                          </div>
                                        </div>

                                        {permLoading === profile.user_id ? (
                                          <div className="flex items-center gap-2 py-3 text-sm text-white/52">
                                            <div className="h-4 w-4 rounded-full border-2 border-violet-300/70 border-t-transparent animate-spin" />
                                            Carregando...
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                            {MODULES.map((mod) => {
                                              const perm = getPermission(profile.user_id, mod.key);
                                              const canView = perm?.can_view ?? false;
                                              const canEdit = perm?.can_edit ?? false;

                                              return (
                                                <div
                                                  key={mod.key}
                                                  className="rounded-[16px] border border-white/7 bg-white/[0.03] p-3"
                                                >
                                                  <div className="flex items-center justify-between gap-3">
                                                    <div className="flex min-w-0 items-center gap-2.5">
                                                      <mod.icon className="h-3.5 w-3.5 shrink-0 text-white/42" />
                                                      <span className="truncate text-[12px] font-semibold text-white/82">
                                                        {mod.label}
                                                      </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          togglePermission(
                                                            profile.user_id,
                                                            mod.key,
                                                            "can_view",
                                                          )
                                                        }
                                                        className={`rfu-mini-btn h-7 rounded-lg px-2.5 text-[10px] ${
                                                          canView
                                                            ? "border-violet-400/20 bg-violet-500/14 text-violet-200"
                                                            : ""
                                                        }`}
                                                        title="Visualizar"
                                                      >
                                                        <Eye className="h-3 w-3" />
                                                        Ver
                                                      </button>

                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          togglePermission(
                                                            profile.user_id,
                                                            mod.key,
                                                            "can_edit",
                                                          )
                                                        }
                                                        disabled={!canView}
                                                        className={`rfu-mini-btn h-7 rounded-lg px-2.5 text-[10px] ${
                                                          canEdit
                                                            ? "border-emerald-400/20 bg-emerald-500/14 text-emerald-300"
                                                            : ""
                                                        }`}
                                                        title="Editar"
                                                      >
                                                        <Pencil className="h-3 w-3" />
                                                        Editar
                                                      </button>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </FragmentRow>
                        );
                      })}

                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-16 text-center">
                            <p className="text-sm font-medium text-white/76">
                              Nenhum usuário encontrado.
                            </p>
                            <p className="mt-1 text-xs text-white/42">
                              Tente ajustar a busca por nome ou email.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </div>
        )}

        <AnimatePresence>
          {deletingUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rfu-modal-backdrop fixed inset-0 z-50 flex items-center justify-center px-4"
              onClick={() => setDeletingUser(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ duration: 0.18 }}
                className="rfu-modal w-full max-w-sm rounded-[24px] p-6 space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h3 className="text-base font-bold text-white">Excluir usuário</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/46">
                    Tem certeza que deseja excluir o usuário{" "}
                    <span className="font-semibold text-white">
                      {deletingUser.full_name || deletingUser.display_name || deletingUser.email}
                    </span>
                    ? Esta ação é irreversível e removerá todas as permissões e dados de
                    acesso.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    className="rfu-btn-ghost"
                    onClick={() => setDeletingUser(null)}
                  >
                    Cancelar
                  </button>

                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-[38px] rounded-full px-4 text-xs font-bold"
                    onClick={deleteUser}
                    disabled={deletingUserLoading}
                  >
                    {deletingUserLoading ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      "Excluir usuário"
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const FragmentRow = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default Usuarios;