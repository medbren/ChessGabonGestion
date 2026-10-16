/**
 * Seed de référence — cohérence classements & persistance.
 * Usage : npx prisma db seed
 *
 * Admin : admin@chessgabon.ga / Admin123!
 */
import { PrismaClient, Platform, TimeControl, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function championshipPoints(rank: number): number {
  const map: Record<number, number> = {
    1: 20, 2: 16, 3: 13, 4: 11, 5: 9, 6: 7, 7: 5, 8: 4, 9: 3, 10: 2,
  };
  return map[rank] ?? 1;
}

async function main() {
  console.log('→ Nettoyage…');
  await prisma.result.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();

  console.log('→ Admin…');
  const password = await bcrypt.hash('Admin123!', 10);
  await prisma.user.create({
    data: { email: 'admin@chessgabon.ga', password, role: Role.ADMIN },
  });

  console.log('→ Membres…');
  const membersData = [
    { firstName: 'Jean', lastName: 'Ndong', pseudo: 'KingNdong', lichess: 'KingNdong', chesscom: 'KingNdong' },
    { firstName: 'Marie', lastName: 'Mba', pseudo: 'BlitzQueen', lichess: 'BlitzQueen', chesscom: 'BlitzQueen' },
    { firstName: 'Paul', lastName: 'Okou', pseudo: 'RapidLion', lichess: 'RapidLion', chesscom: 'RapidLion' },
    { firstName: 'Alice', lastName: 'Nze', pseudo: 'ChessGabon01', lichess: 'ChessGabon01', chesscom: 'ChessGabon01' },
    { firstName: 'Bruno', lastName: 'Ella', pseudo: 'RookMaster', lichess: 'RookMaster', chesscom: 'RookMaster' },
  ];

  const members: Record<string, number> = {};
  for (const m of membersData) {
    const created = await prisma.member.create({ data: m });
    members[m.pseudo] = created.id;
  }

  console.log('→ Tournoi A (Rapid Lichess)…');
  const tA = await prisma.tournament.create({
    data: {
      name: 'Arena Rapid Juin',
      platform: Platform.LICHESS,
      timeControl: TimeControl.RAPID,
      date: new Date('2026-06-01'),
    },
  });

  for (const r of [
    { pseudo: 'KingNdong', rank: 1, points: 8.0 },
    { pseudo: 'BlitzQueen', rank: 2, points: 7.0 },
    { pseudo: 'RapidLion', rank: 3, points: 6.5 },
    { pseudo: 'ChessGabon01', rank: 4, points: 5.5 },
    { pseudo: 'RookMaster', rank: 5, points: 4.0 },
  ]) {
    await prisma.result.create({
      data: {
        memberId: members[r.pseudo],
        tournamentId: tA.id,
        points: r.points,
        rank: r.rank,
        championshipPoints: championshipPoints(r.rank),
      },
    });
  }

  console.log('→ Tournoi B (Blitz Chess.com)…');
  const tB = await prisma.tournament.create({
    data: {
      name: 'Blitz Club Soir',
      platform: Platform.CHESSCOM,
      timeControl: TimeControl.BLITZ,
      date: new Date('2026-06-15'),
    },
  });

  for (const r of [
    { pseudo: 'BlitzQueen', rank: 1, points: 9.0 },
    { pseudo: 'KingNdong', rank: 2, points: 7.5 },
    { pseudo: 'RookMaster', rank: 3, points: 6.0 },
    { pseudo: 'RapidLion', rank: 4, points: 5.0 },
    { pseudo: 'ChessGabon01', rank: 5, points: 3.5 },
  ]) {
    await prisma.result.create({
      data: {
        memberId: members[r.pseudo],
        tournamentId: tB.id,
        points: r.points,
        rank: r.rank,
        championshipPoints: championshipPoints(r.rank),
      },
    });
  }

  const expected: Record<string, number> = {
    KingNdong: 36, BlitzQueen: 36, RapidLion: 24, RookMaster: 22, ChessGabon01: 20,
  };

  console.log('→ Vérification totaux championnat…');
  for (const [pseudo, id] of Object.entries(members)) {
    const agg = await prisma.result.aggregate({
      where: { memberId: id },
      _sum: { championshipPoints: true },
      _count: true,
    });
    const total = agg._sum.championshipPoints ?? 0;
    const ok = total === expected[pseudo] ? 'OK' : `FAIL (got ${total})`;
    console.log(`   ${pseudo}: ${total} pts · ${agg._count} tournois · ${ok}`);
  }

  console.log('✓ Seed terminé.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
