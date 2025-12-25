-- ============================================
-- ADICIONAR SUPORTE A ADMIN NO SUPABASE
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================

-- Adicionar coluna is_admin na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Definir o usuário específico como admin (reus_julio@hotmail.com)
-- Este comando atualiza o perfil baseado no email do usuário
UPDATE public.profiles
SET is_admin = true
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'reus_julio@hotmail.com'
);

-- Se o perfil não existir ainda, você precisará criar ou aguardar que seja criado
-- Para verificar se funcionou, execute:
-- SELECT p.id, p.username, p.email, p.is_admin, u.email as auth_email
-- FROM public.profiles p
-- JOIN auth.users u ON p.id = u.id
-- WHERE u.email = 'reus_julio@hotmail.com';

-- Remover política antiga de delete para songs
DROP POLICY IF EXISTS "Users can delete own songs" ON public.songs;

-- Nova política: apenas admins podem deletar músicas
CREATE POLICY "Admins can delete any songs" ON public.songs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Garantir que a política de update também verifica admin (opcional, mas recomendado)
DROP POLICY IF EXISTS "Users can update own songs" ON public.songs;
CREATE POLICY "Admins can update any songs" ON public.songs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- IMPORTANTE: Após executar este script, você precisará:
-- 1. Verificar se o usuário foi marcado como admin corretamente
-- 2. Testar a funcionalidade de exclusão
