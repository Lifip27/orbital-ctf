import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.isAdmin === true;
}

async function resolveCategory(category: string): Promise<string> {
  const normalized = category.trim();
  if (!normalized) {
    return normalized;
  }

  const existing = await prisma.challenge.findFirst({
    where: {
      category: {
        equals: normalized,
        mode: 'insensitive'
      }
    },
    select: { category: true },
    orderBy: { category: 'asc' }
  });

  return existing?.category ?? normalized;
}

export async function POST(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { title, description, category, points, flag, flags, multipleFlags, difficulty, isLocked, files, hints, unlockConditions, link, solveExplanation } = await req.json();
    const normalizedCategory = await resolveCategory(category);

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        category: normalizedCategory,
        points,
        flag: multipleFlags ? undefined : flag,
        multipleFlags: multipleFlags || false,
        flags: multipleFlags && flags ? {
          create: flags.map((flag: { flag: string; points: number }) => ({
            flag: flag.flag,
            points: flag.points
          }))
        } : undefined,
        difficulty,
        isLocked: isLocked || false,
        link,
        solveExplanation,
        files: files ? {
          create: files.map((file: { name: string; path: string; size: number }) => ({
            name: file.name,
            path: file.path,
            size: file.size
          }))
        } : undefined,
        hints: hints ? {
          create: hints.map((hint: { content: string; cost: number }) => ({
            content: hint.content,
            cost: hint.cost
          }))
        } : undefined,
        unlockConditions: unlockConditions ? {
          create: unlockConditions.map((cond: { type: string; requiredChallengeId?: string; timeThresholdSeconds?: number }) => ({
            type: cond.type,
            requiredChallengeId: cond.requiredChallengeId,
            timeThresholdSeconds: cond.timeThresholdSeconds
          }))
        } : undefined
      },
      include: {
        files: true,
        hints: true,
        flags: true,
        unlockConditions: true
      }
    });

    return NextResponse.json(challenge, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Error creating challenge' },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const challenges = await prisma.challenge.findMany({
      include: {
        files: true,
        hints: true,
        flags: true,
        unlockConditions: true,
        submissions: {
          where: { isCorrect: true },
          select: {
            teamId: true,
            team: { select: { name: true, color: true } }
          }
        }
      }
    });

    const transformed = challenges.map(ch => ({
      ...ch,
      solvedBy: ch.submissions.map(sub => ({
        id: sub.teamId,
        name: sub.team.name,
        color: sub.team.color
      }))
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return NextResponse.json(
      { error: 'Error fetching challenges' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = await req.json();

    await prisma.challenge.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Error deleting challenge:', error);
    return NextResponse.json(
      { error: 'Error deleting challenge' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id, title, description, category, points, flag, flags, multipleFlags, difficulty, isActive, isLocked, files, hints, unlockConditions, link, solveExplanation } = await req.json();
    const normalizedCategory = typeof category === 'string' ? await resolveCategory(category) : category;

    // Get the current challenge state to check if it was previously locked
    const currentChallenge = await prisma.challenge.findUnique({
      where: { id },
      select: { isLocked: true, title: true }
    });

    const challenge = await prisma.challenge.update({
      where: { id },
      data: {
        title,
        description,
        category: normalizedCategory,
        points,
        flag: multipleFlags ? undefined : flag,
        multipleFlags,
        flags: flags ? {
          deleteMany: {},
          create: flags.map((flag: { flag: string; points: number }) => ({
            flag: flag.flag,
            points: flag.points
          }))
        } : undefined,
        difficulty,
        isActive,
        isLocked,
        link,
        solveExplanation,
        unlockConditions: unlockConditions ? {
          deleteMany: {},
          create: unlockConditions.map((cond: { type: string; requiredChallengeId?: string; timeThresholdSeconds?: number }) => ({
            type: cond.type,
            requiredChallengeId: cond.requiredChallengeId,
            timeThresholdSeconds: cond.timeThresholdSeconds
          }))
        } : {
          deleteMany: {}
        },
        files: files ? {
          deleteMany: {},
          create: files.map((file: { name: string; path: string; size: number }) => ({
            name: file.name,
            path: file.path,
            size: file.size
          }))
        } : undefined,
        hints: hints ? {
          deleteMany: {},
          create: hints.map((hint: { content: string; cost: number }) => ({
            content: hint.content,
            cost: hint.cost
          }))
        } : undefined
      },
      include: {
        files: true,
        hints: true,
        flags: true,
        unlockConditions: true
      }
    });

    // Log activity if challenge was unlocked
    if (currentChallenge?.isLocked && !isLocked) {
      await prisma.activityLog.create({
        data: {
          type: 'CHALLENGE_UNLOCKED',
          description: `Challenge "${challenge.title}" has been unlocked by an admin`,
        },
      });
    }

    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Error updating challenge:', error);
    return NextResponse.json(
      { error: 'Error updating challenge' },
      { status: 500 }
    );
  }
}
