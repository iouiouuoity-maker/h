-- ТЕК ЕСКІ V1 дерекқоры үшін. Жаңа база schema.sql арқылы құрылады. Бір рет орындаңыз.
ALTER TABLE users ADD COLUMN study_group TEXT NOT NULL DEFAULT 'ai' CHECK(study_group IN ('ai','comparison'));
-- Бұрынғы аккаунттардың default тобы — AI. Салыстыру тобын әкімші кабинетінен бекітіңіз.
ALTER TABLE materials ADD COLUMN support TEXT NOT NULL DEFAULT '{}';
