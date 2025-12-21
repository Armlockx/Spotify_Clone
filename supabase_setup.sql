-- ============================================
-- SETUP COMPLETO DO SUPABASE PARA SPOTIFY CLONE
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================

-- ============================================
-- PARTE 1: Tabela de Perfis de Usuário
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PARTE 2: Tabela de Músicas
-- ============================================

CREATE TABLE IF NOT EXISTS public.songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    artist TEXT NOT NULL,
    cover TEXT,
    file TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    uploaded BOOLEAN DEFAULT false,
    file_name TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PARTE 3: Tabela de Favoritos
-- ============================================

CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, song_id)
);

-- ============================================
-- PARTE 4: Tabela de Histórico
-- ============================================

CREATE TABLE IF NOT EXISTS public.history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, song_id)
);

-- ============================================
-- PARTE 5: Tabela de Playlists
-- ============================================

CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PARTE 6: Tabela de Músicas nas Playlists
-- ============================================

CREATE TABLE IF NOT EXISTS public.playlist_songs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
    song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playlist_id, song_id)
);

-- ============================================
-- PARTE 7: Função RPC para criar perfil
-- ============================================

CREATE OR REPLACE FUNCTION create_user_profile(
    user_id UUID,
    user_username TEXT,
    user_avatar_url TEXT,
    user_email TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_data JSON;
    current_user_id UUID;
    is_new_user BOOLEAN;
BEGIN
    current_user_id := auth.uid();
    
    SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = user_id
        AND created_at > NOW() - INTERVAL '5 minutes'
    ) INTO is_new_user;

    IF current_user_id IS NULL AND NOT is_new_user THEN
        RAISE EXCEPTION 'Usuário não autenticado ou não autorizado para criar perfil';
    END IF;
    
    IF current_user_id IS NOT NULL AND user_id != current_user_id THEN
        RAISE EXCEPTION 'Não autorizado: você só pode criar/atualizar seu próprio perfil';
    END IF;
    
    IF user_username IS NULL OR LENGTH(TRIM(user_username)) < 3 THEN
        RAISE EXCEPTION 'Username deve ter pelo menos 3 caracteres';
    END IF;
    
    IF LENGTH(TRIM(user_username)) > 30 THEN
        RAISE EXCEPTION 'Username deve ter no máximo 30 caracteres';
    END IF;
    
    INSERT INTO profiles (id, username, avatar_url, email)
    VALUES (user_id, TRIM(user_username), user_avatar_url, user_email)
    ON CONFLICT (id) DO UPDATE
    SET 
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        email = EXCLUDED.email,
        updated_at = NOW()
    RETURNING json_build_object(
        'id', id,
        'username', username,
        'avatar_url', avatar_url,
        'email', email
    ) INTO profile_data;
    
    RETURN profile_data;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, public;

-- ============================================
-- PARTE 8: Row Level Security (RLS) Policies
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

-- Policies para Profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies para Songs
DROP POLICY IF EXISTS "Anyone can view songs" ON public.songs;
CREATE POLICY "Anyone can view songs" ON public.songs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert songs" ON public.songs;
CREATE POLICY "Authenticated users can insert songs" ON public.songs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own songs" ON public.songs;
CREATE POLICY "Users can update own songs" ON public.songs FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own songs" ON public.songs;
CREATE POLICY "Users can delete own songs" ON public.songs FOR DELETE USING (auth.uid() = user_id);

-- Policies para Favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- Policies para History
DROP POLICY IF EXISTS "Users can view own history" ON public.history;
CREATE POLICY "Users can view own history" ON public.history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own history" ON public.history;
CREATE POLICY "Users can insert own history" ON public.history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own history" ON public.history;
CREATE POLICY "Users can delete own history" ON public.history FOR DELETE USING (auth.uid() = user_id);

-- Policies para Playlists
DROP POLICY IF EXISTS "Users can view own playlists" ON public.playlists;
CREATE POLICY "Users can view own playlists" ON public.playlists FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own playlists" ON public.playlists;
CREATE POLICY "Users can insert own playlists" ON public.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own playlists" ON public.playlists;
CREATE POLICY "Users can update own playlists" ON public.playlists FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own playlists" ON public.playlists;
CREATE POLICY "Users can delete own playlists" ON public.playlists FOR DELETE USING (auth.uid() = user_id);

-- Policies para Playlist Songs
DROP POLICY IF EXISTS "Users can view playlist songs from own playlists" ON public.playlist_songs;
CREATE POLICY "Users can view playlist songs from own playlists" ON public.playlist_songs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_songs.playlist_id
            AND playlists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert songs to own playlists" ON public.playlist_songs;
CREATE POLICY "Users can insert songs to own playlists" ON public.playlist_songs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_songs.playlist_id
            AND playlists.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete songs from own playlists" ON public.playlist_songs;
CREATE POLICY "Users can delete songs from own playlists" ON public.playlist_songs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.playlists
            WHERE playlists.id = playlist_songs.playlist_id
            AND playlists.user_id = auth.uid()
        )
    );

-- ============================================
-- FIM DO SETUP
-- ============================================

