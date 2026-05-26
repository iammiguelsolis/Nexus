-- ============================================================
-- NEXUS — Migration 004: Aula Virtual (Classroom) + Chat
-- ============================================================

-- PUBLICACIONES DEL AULA (anuncios, materiales, enlaces)
CREATE TABLE aula_post (
  post_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matching_id    UUID REFERENCES matching(matching_id) ON DELETE CASCADE,
  autor_id       UUID REFERENCES usuario(usuario_id),
  tipo           VARCHAR(20) NOT NULL CHECK (tipo IN ('anuncio','material','enlace')),
  titulo         VARCHAR(300),
  contenido      TEXT,
  url_enlace     VARCHAR(500),
  fijado         BOOLEAN DEFAULT false,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- RECURSOS ADJUNTOS A UN POST (enlaces externos)
CREATE TABLE aula_recurso (
  recurso_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES aula_post(post_id) ON DELETE CASCADE,
  nombre        VARCHAR(300) NOT NULL,
  url           VARCHAR(500) NOT NULL,
  tipo          VARCHAR(50) DEFAULT 'otro',
  fecha_subida  TIMESTAMP DEFAULT NOW()
);

-- COMENTARIOS EN POSTS
CREATE TABLE aula_comentario (
  comentario_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id        UUID REFERENCES aula_post(post_id) ON DELETE CASCADE,
  autor_id       UUID REFERENCES usuario(usuario_id),
  contenido      TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- CHAT 1:1 ENTRE MENTOR Y PADAWAN
CREATE TABLE mensaje_chat (
  mensaje_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matching_id  UUID REFERENCES matching(matching_id) ON DELETE CASCADE,
  emisor_id    UUID REFERENCES usuario(usuario_id),
  contenido    TEXT NOT NULL,
  leido        BOOLEAN DEFAULT false,
  fecha_envio  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO aula_post (matching_id, autor_id, tipo, titulo, contenido, fijado) VALUES
  ('fc333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222',
   'anuncio', '¡Bienvenida al programa de mentoría!',
   'Hola María, estoy emocionado de ser tu mentor. En este espacio compartiremos recursos, tareas y seguiremos tu progreso juntos. ¡Vamos con todo! 🚀', true),
  ('fc333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222',
   'enlace', 'Enlace a sesiones Meet',
   'Usaremos este enlace para todas nuestras sesiones virtuales.', false),
  ('fc333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222',
   'material', 'Roadmap de React 2026',
   'Este es el roadmap que seguiremos. Revísalo y dime si tienes dudas.', false);

UPDATE aula_post SET url_enlace = 'https://meet.google.com/abc-defg-hij'
WHERE titulo = 'Enlace a sesiones Meet';

INSERT INTO aula_recurso (post_id, nombre, url, tipo)
SELECT post_id, 'React Roadmap (web)', 'https://roadmap.sh/react', 'enlace'
FROM aula_post WHERE titulo = 'Roadmap de React 2026';

INSERT INTO aula_recurso (post_id, nombre, url, tipo)
SELECT post_id, 'Repositorio del curso', 'https://github.com/example/react-course', 'github'
FROM aula_post WHERE titulo = 'Roadmap de React 2026';

INSERT INTO aula_comentario (post_id, autor_id, contenido)
SELECT post_id, 'a1111111-1111-1111-1111-111111111111',
  '¡Gracias profesor! Estoy muy motivada para empezar 💪'
FROM aula_post WHERE titulo LIKE '%Bienvenida%';

INSERT INTO mensaje_chat (matching_id, emisor_id, contenido, leido) VALUES
  ('fc333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222',
   'Hola María, ¿pudiste revisar el roadmap que compartí?', true),
  ('fc333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111',
   'Sí profesor, lo estoy revisando. Tengo una duda sobre custom hooks.', true),
  ('fc333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222',
   'Perfecto, lo vemos en la próxima sesión. 👍', false);
