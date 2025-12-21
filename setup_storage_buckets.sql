-- ============================================
-- POLÍTICAS DE STORAGE PARA BUCKETS
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Certifique-se de criar os buckets "tracks" e "covers" primeiro
-- ============================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Todos podem ler tracks" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de tracks" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar suas próprias tracks" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar suas próprias tracks" ON storage.objects;

DROP POLICY IF EXISTS "Todos podem ler covers" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de covers" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar suas próprias covers" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar suas próprias covers" ON storage.objects;

-- Policies for BUCKET "tracks"
CREATE POLICY "Todos podem ler tracks"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'tracks');

CREATE POLICY "Usuários autenticados podem fazer upload de tracks"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tracks');

CREATE POLICY "Usuários autenticados podem atualizar suas próprias tracks"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários autenticados podem deletar suas próprias tracks"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for BUCKET "covers"
CREATE POLICY "Todos podem ler covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

CREATE POLICY "Usuários autenticados podem fazer upload de covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Usuários autenticados podem atualizar suas próprias covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuários autenticados podem deletar suas próprias covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

