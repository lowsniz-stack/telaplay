const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@telaplay.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'TelaPlay@2026';

  // Admin
  const password = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password,
      name: 'Administrador',
      role: 'ADMIN',
    },
    create: {
      email: adminEmail,
      password,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });
  console.log('✅ Usuário admin criado:', admin.email);

  // Empresa demo
  const company = await prisma.company.upsert({
    where: { slug: 'empresa-demo' },
    update: {},
    create: {
      name: 'Empresa Demo',
      slug: 'empresa-demo',
      userId: admin.id,
    },
  });
  console.log('✅ Empresa criada:', company.name);

  // Mídias demo
  const mediaItems = await Promise.all([
    prisma.media.upsert({
      where: { id: 'demo-media-1' },
      update: {},
      create: {
        id: 'demo-media-1',
        name: 'Banner Promoção',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=640&q=60',
        duration: 10,
        companyId: company.id,
      },
    }),
    prisma.media.upsert({
      where: { id: 'demo-media-2' },
      update: {},
      create: {
        id: 'demo-media-2',
        name: 'Cardápio Digital',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=640&q=60',
        duration: 15,
        companyId: company.id,
      },
    }),
    prisma.media.upsert({
      where: { id: 'demo-media-3' },
      update: {},
      create: {
        id: 'demo-media-3',
        name: 'Slide Institucional',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=60',
        duration: 12,
        companyId: company.id,
      },
    }),
  ]);
  console.log('✅ Mídias criadas:', mediaItems.length);

  // Playlist demo
  const playlist = await prisma.playlist.upsert({
    where: { id: 'demo-playlist-1' },
    update: {},
    create: {
      id: 'demo-playlist-1',
      name: 'Playlist Principal',
      description: 'Conteúdo geral para todas as telas',
      loop: true,
      companyId: company.id,
    },
  });

  // Itens da playlist
  for (let i = 0; i < mediaItems.length; i++) {
    await prisma.playlistItem.upsert({
      where: { id: `demo-item-${i + 1}` },
      update: {},
      create: {
        id: `demo-item-${i + 1}`,
        playlistId: playlist.id,
        mediaId: mediaItems[i].id,
        order: i,
      },
    });
  }
  console.log('✅ Playlist criada com', mediaItems.length, 'itens');

  // Telas demo
  const screens = await Promise.all([
    prisma.screen.upsert({
      where: { deviceId: 'device-elevador-a' },
      update: {},
      create: {
        name: 'Elevador A',
        deviceId: 'device-elevador-a',
        shareToken: 'token-elevador-a',
        location: 'Piso térreo',
        group: 'Elevadores',
        companyId: company.id,
      },
    }),
    prisma.screen.upsert({
      where: { deviceId: 'device-recepcao' },
      update: {},
      create: {
        name: 'Recepção Principal',
        deviceId: 'device-recepcao',
        shareToken: 'token-recepcao',
        location: 'Entrada principal',
        group: 'Recepção',
        companyId: company.id,
      },
    }),
    prisma.screen.upsert({
      where: { deviceId: 'device-loja-b' },
      update: {},
      create: {
        name: 'Vitrine Loja B',
        deviceId: 'device-loja-b',
        shareToken: 'token-loja-b',
        location: 'Corredor central',
        group: 'Lojas',
        companyId: company.id,
      },
    }),
  ]);

  // Vincular playlist às telas
  for (const screen of screens) {
    await prisma.screenPlaylist.upsert({
      where: { screenId_playlistId: { screenId: screen.id, playlistId: playlist.id } },
      update: {},
      create: { screenId: screen.id, playlistId: playlist.id, priority: 0 },
    });
  }
  console.log('✅ Telas criadas e vinculadas:', screens.length);

  console.log('\n🎉 Seed concluído!');
  console.log('─────────────────────────────');
  console.log(`Login: ${adminEmail}`);
  console.log(`Senha: ${adminPassword}`);
  console.log('─────────────────────────────');
  console.log('Players de demo:');
  console.log('  /player/token-elevador-a');
  console.log('  /player/token-recepcao');
  console.log('  /player/token-loja-b');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());