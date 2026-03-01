const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/actions.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace Block 1: getTodayTasks routines query
const block1Regex = /<<<<<<< HEAD\n\s*const routinesData = await prisma\.routine\.findMany\(\{[\s\S]*?orderBy: \{ id: 'asc' \}\n\s*\}\n=======\n[\s\S]*?>>>>>>> main/m;
content = content.replace(block1Regex, `        const routinesData = await prisma.routine.findMany({
            where: { userId: session.userId },
            include: {
                tasks: {
                    include: { taskCompletions: { where: { dailyLogId: logId } } },
                    orderBy: { id: 'asc' }
                }
            }
        });`);

// Fix Block 1 part 2 (if weekend -> filter Gym)
content = content.replace(
    /const sortedRoutines = routinesData.filter\(r => isWeekend && r.category === 'work'\? false : true\)/g,
    `const sortedRoutines = routinesData.filter(r => isWeekend && r.category === 'work' ? false : true)`
);

// We need to inject the GYM/BOXING exclusion into sortedRoutines map.
// Let's rely on string replacement.
content = content.replace(
    /return sortedRoutines\.map\(r => \(\{\n\s*id: r\.id, name: r\.name, time: `\$\{r\.startTime\} - \$\{r\.endTime\}`/,
    `return sortedRoutines.map(r => {
            let filteredTasks = r.tasks;
            if (isWeekend) {
                filteredTasks = filteredTasks.filter(t => {
                    const titleUpper = t.title.toUpperCase();
                    return !(titleUpper.includes('GYM') || titleUpper.includes('BOXING'));
                });
            }
            return {
            id: r.id, name: r.name, time: \`\${r.startTime} - \${r.endTime}\``
);
content = content.replace(/tasks: r\.tasks\.map\(t => \{/, `tasks: filteredTasks.map(t => {`);
content = content.replace(/return sortedRoutines\.map\(r => \(\{/, `return sortedRoutines.map(r => { return {`);
// That's tricky. Let's do it safer. 
// Just leave the script approach for getTodayTasks and manually replace the specific lines? 
// No, regex is fine if careful. But let's just do an exact match replace for the `return sortedRoutines.map` part.
`

let replaceFilteredTasks = \`return sortedRoutines.map(r => {
            let filteredTasks = r.tasks;
            if (isWeekend) {
                filteredTasks = filteredTasks.filter(t => {
                    const titleUpper = t.title.toUpperCase();
                    return !(titleUpper.includes('GYM') || titleUpper.includes('BOXING'));
                });
            }
            return {
            id: r.id, name: r.name, time: \\\`\${r.startTime} - \${r.endTime}\\\`, category: r.category,
            tasks: filteredTasks.map(t => {
                const comp = t.taskCompletions[0];
                return {
                    id: t.id, title: t.title, exp: t.expValue,
                    completed: !!(comp && comp.completedAt),
                    isGym: t.title.toLowerCase().includes('gym') || t.title.toLowerCase().includes('boxing'),
                    target: t.targetValue || 1, unit: t.unit, progress: comp ? comp.progress : 0
                };
            })
        };});\`;

content = content.replace(/return sortedRoutines\.map\(r => \(\{[\s\S]*?\}\)\);/, replaceFilteredTasks);

// Replace Block 2: _awardTaskCompletion
const block2Regex = /<<<<<<< HEAD\n\s*const newExp = exp \+ expGained;[\s\S]*?let finalLevel = level;\n=======\n[\s\S]*?>>>>>>> main/m;
content = content.replace(block2Regex, `    const newExp = exp + expGained;
const nextLevelThreshold = level * 1000;
const goldGained = Math.floor(newExp / 100) - Math.floor(exp / 100);
const newGold = gold + goldGained;

let finalLevel = level; `);

// Replace Block 3: _revertTaskCompletion
const block3Regex = /<<<<<<< HEAD\nasync function _revertTaskCompletion\(tx, userId, taskId, logId\) \{[\s\S]*?const goldLost = Math.floor\(user.exp \/ 100\) - Math.floor\(newExp \/ 100\);\n=======\n[\s\S]*?>>>>>>> main/m;
content = content.replace(block3Regex, `async function _revertTaskCompletion(tx, userId, taskId, logId) {
    const task = await tx.task.findUnique({ where: { id: taskId } });
    const expValue = task.expValue || 0;
    const user = await tx.user.findUnique({ where: { id: userId } });
    const newExp = user.exp - expValue;
    const goldLost = Math.floor(user.exp / 100) - Math.floor(newExp / 100); `);

// Replace Block 4: checkAchievements
const block4Regex = /<<<<<<< HEAD\nasync function checkAchievements\(tx, userId\) \{[\s\S]*?=======\n[\s\S]*?>>>>>>> main/m;
content = content.replace(block4Regex, `async function checkAchievements(tx, userId) {
        const newUnlocks = [];

        // 1. IRON BODY
        const gymCount = await tx.taskCompletion.count({
            where: {
                task: {
                    OR: [
                        { title: { contains: 'Gym', mode: 'insensitive' } },
                        { title: { contains: 'Workout', mode: 'insensitive' } },
                        { title: { contains: 'Pushup', mode: 'insensitive' } },
                        { title: { contains: 'Squat', mode: 'insensitive' } }
                    ]
                },
                completedAt: { not: null },
                dailyLog: { userId: userId }
            }
        });
        if (gymCount >= 50) {
            const t1 = await tx.userTitle.upsert({
                where: { userId_titleId: { userId, titleId: 'Iron Body' } },
                create: { userId, titleId: 'Iron Body' },
                update: {}
            });
            if (t1) newUnlocks.push('Iron Body');
        }

        // 2. SCHOLAR
        const studyCount = await tx.taskCompletion.count({
            where: {
                task: {
                    OR: [
                        { title: { contains: 'Read', mode: 'insensitive' } },
                        { title: { contains: 'Study', mode: 'insensitive' } },
                        { title: { contains: 'Deep Work', mode: 'insensitive' } }
                    ]
                },
                completedAt: { not: null },
                dailyLog: { userId: userId }
            }
        });

        if (studyCount >= 20) {
            const t2 = await tx.userTitle.upsert({
                where: { userId_titleId: { userId, titleId: 'Scholar' } },
                create: { userId, titleId: 'Scholar' },
                update: {}
            });
            if (t2) newUnlocks.push('Scholar');
        }

        // 3. EARLY BIRD ( completed time < 6 AM )
        const earlyCountResult = await tx.$queryRaw\`
        SELECT COUNT(*) as count FROM "task_completions" tc
        JOIN "daily_logs" dl ON tc.daily_log_id = dl.id
        WHERE dl.user_id = \${userId}
        AND EXTRACT(HOUR FROM tc.completed_at AT TIME ZONE 'Asia/Kolkata') < 6
    \`;
    const earlyCount = Number(earlyCountResult[0]?.count || 0);

    if (earlyCount >= 7) {
        const t3 = await tx.userTitle.upsert({
            where: { userId_titleId: { userId, titleId: 'The Early Bird' } },
            create: { userId, titleId: 'The Early Bird' },
            update: {}
        });
        if (t3) newUnlocks.push('The Early Bird');
    }

    return newUnlocks;
}`);
        // Note: We need to remove the dangling head markers for checkAchievements if there were any split markers. Wait, block4Regex matches up to `>>>>>>> main`. But wait, checkAchievements was split into two conflict chunks in view_file !
        // Let me just replace the WHOLE function safely.
        content = content.replace(/async function checkAchievements[\\s\\S]*?export async function toggleTask/m, `\${checkAchievementsNew}\nexport async function toggleTask`);

        // Wait, doing this via string replace node script might be tough if I don't see exact text.
        // Let's just create a completely valid `app/actions.js` by running a regex cleaner script, then test it.
        fs.writeFileSync(filePath, content);

        console.log('Resolved Phase 1'); `);
