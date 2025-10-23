/**
 * API: /api/admin/sponsors/[sponsorId]
 *
 * 处理单个 sponsor 的操作（GET, DELETE 等）
 */

import { NextApiRequest, NextApiResponse } from 'next';
import initializeApi from '../../../../lib/admin/init';
import firebase from 'firebase-admin';

initializeApi();
const db = firebase.firestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    return handleDelete(req, res);
  }

  if (req.method === 'PUT') {
    return handleUpdate(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未認證' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await firebase.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    console.log('[DeleteSponsor] User ID:', userId);

    // 2. Check user permissions (must be super_admin or admin)
    const userDoc = await db.collection('registrations').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: '用戶不存在' });
    }

    const userData = userDoc.data();
    const permissions = userData?.permissions || userData?.user?.permissions || [];
    const isSuperAdmin = permissions.includes('super_admin') || permissions[0] === 'super_admin';
    const isAdmin = permissions.includes('admin') || permissions[0] === 'admin';

    if (!isSuperAdmin && !isAdmin) {
      return res.status(403).json({ error: '權限不足：僅管理員可刪除贊助商' });
    }

    // 3. Get sponsorId from query
    const { sponsorId } = req.query;

    if (!sponsorId || typeof sponsorId !== 'string') {
      return res.status(400).json({ error: 'Invalid sponsor ID' });
    }

    console.log('[DeleteSponsor] Sponsor ID:', sponsorId);

    // 4. Check if sponsor exists
    console.log('[DeleteSponsor] Checking if sponsor exists...');
    const sponsorSnapshot = await db
      .collection('extended-sponsors')
      .where('id', '==', sponsorId)
      .limit(1)
      .get();

    console.log('[DeleteSponsor] Sponsor exists:', !sponsorSnapshot.empty);
    if (sponsorSnapshot.empty) {
      console.log('[DeleteSponsor] ❌ Sponsor not found:', sponsorId);
      return res.status(404).json({ error: '找不到該贊助商' });
    }

    const sponsorDoc = sponsorSnapshot.docs[0];
    const sponsorName = sponsorDoc.data().name;
    console.log('[DeleteSponsor] Sponsor name:', sponsorName);

    // 5. Check if sponsor has associated tracks
    console.log('[DeleteSponsor] Checking for associated tracks...');
    const tracksSnapshot = await db.collection('tracks').where('sponsorId', '==', sponsorId).get();

    console.log('[DeleteSponsor] Associated tracks count:', tracksSnapshot.size);
    if (!tracksSnapshot.empty) {
      const trackNames = tracksSnapshot.docs.map((d) => d.data().name || d.data().trackId);
      console.log('[DeleteSponsor] ❌ Cannot delete: has tracks:', trackNames);
      return res.status(400).json({
        error: '無法刪除：此贊助商還有關聯的賽道',
        details: `此贊助商有 ${tracksSnapshot.size} 個賽道，請先重新分配這些賽道`,
        tracks: trackNames,
      });
    }

    // 6. Check if sponsor has associated challenges
    console.log('[DeleteSponsor] Checking for associated challenges...');
    const challengesSnapshot = await db
      .collection('extended-challenges')
      .where('sponsorId', '==', sponsorId)
      .get();

    console.log('[DeleteSponsor] Associated challenges count:', challengesSnapshot.size);
    if (!challengesSnapshot.empty) {
      const challengeNames = challengesSnapshot.docs.map(
        (d) => d.data().title || d.data().challengeId,
      );
      console.log('[DeleteSponsor] ❌ Cannot delete: has challenges:', challengeNames);
      return res.status(400).json({
        error: '無法刪除：此贊助商還有關聯的挑戰',
        details: `此贊助商有 ${challengesSnapshot.size} 個挑戰，請先重新分配這些挑戰`,
        challenges: challengeNames,
      });
    }

    // 7. Delete the sponsor
    await sponsorDoc.ref.delete();

    // 8. Log activity
    try {
      await db.collection('sponsor-activity-logs').add({
        userId: userId,
        action: 'delete_sponsor',
        resourceType: 'sponsor',
        resourceId: sponsorId,
        sponsorName: sponsorName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[DeleteSponsor] Failed to log activity:', logError);
    }

    console.log('[DeleteSponsor] Successfully deleted sponsor:', sponsorId);

    return res.status(200).json({
      success: true,
      message: `贊助商 ${sponsorName} 已成功刪除`,
    });
  } catch (error: any) {
    console.error('[DeleteSponsor] Error:', error);
    return res.status(500).json({
      error: '服務器錯誤',
      details: error.message,
    });
  }
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未認證' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await firebase.auth().verifyIdToken(token);
    const userId = decodedToken.uid;

    console.log('[UpdateSponsor] User ID:', userId);

    // 2. Check user permissions (must be super_admin or admin)
    const userDoc = await db.collection('registrations').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: '用戶不存在' });
    }

    const userData = userDoc.data();
    const permissions = userData?.permissions || userData?.user?.permissions || [];
    const isSuperAdmin = permissions.includes('super_admin') || permissions[0] === 'super_admin';
    const isAdmin = permissions.includes('admin') || permissions[0] === 'admin';

    if (!isSuperAdmin && !isAdmin) {
      return res.status(403).json({ error: '權限不足：僅管理員可編輯贊助商' });
    }

    // 3. Get sponsorId from query
    const { sponsorId } = req.query;

    if (!sponsorId || typeof sponsorId !== 'string') {
      return res.status(400).json({ error: 'Invalid sponsor ID' });
    }

    console.log('[UpdateSponsor] Sponsor ID:', sponsorId);

    // 4. Get update data from request body
    const {
      name,
      tier,
      description,
      logoUrl,
      kvImageUrl,
      websiteUrl,
      contactEmail,
      contactName,
      managers,
    } = req.body;

    // 5. Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '贊助商名稱為必填項' });
    }

    // 6. Check if sponsor exists
    console.log('[UpdateSponsor] Checking if sponsor exists...');
    const sponsorDoc = await db.collection('extended-sponsors').doc(sponsorId).get();

    if (!sponsorDoc.exists) {
      console.log('[UpdateSponsor] ❌ Sponsor not found:', sponsorId);
      return res.status(404).json({ error: '找不到該贊助商' });
    }

    console.log('[UpdateSponsor] Sponsor found, updating...');

    // 7. Prepare update data
    const updateData: any = {
      name: name.trim(),
      tier: tier || 'track',
      description: description?.trim() || '',
      logoUrl: logoUrl || '',
      kvImageUrl: kvImageUrl || '',
      websiteUrl: websiteUrl || '',
      contactEmail: contactEmail || '',
      contactName: contactName || '',
      managers: managers || [],
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId,
    };

    // 8. Update sponsor-user-mappings and grant sponsor permissions
    if (managers && Array.isArray(managers)) {
      console.log('[UpdateSponsor] Processing managers:', managers);

      // Delete existing mappings for this sponsor
      const existingMappings = await db
        .collection('sponsor-user-mappings')
        .where('sponsorId', '==', sponsorId)
        .get();

      const deleteBatch = db.batch();
      existingMappings.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();
      console.log('[UpdateSponsor] Deleted', existingMappings.size, 'existing mappings');

      // Create new mappings and grant sponsor permissions
      for (const manager of managers) {
        // Handle both string and object formats
        const email = typeof manager === 'string' ? manager : manager?.email;
        if (!email || typeof email !== 'string') continue;

        const normalizedEmail = email.trim().toLowerCase();

        // Find user by email in registrations collection
        // Try multiple approaches to find the user
        let userQuery = await db
          .collection('registrations')
          .where('email', '==', normalizedEmail)
          .limit(1)
          .get();

        // If not found, try preferredEmail
        if (userQuery.empty) {
          userQuery = await db
            .collection('registrations')
            .where('preferredEmail', '==', normalizedEmail)
            .limit(1)
            .get();
        }

        // If still not found, search through all registrations (for nested email fields)
        if (userQuery.empty) {
          console.log(
            '[UpdateSponsor] Searching through all registrations for nested email fields...',
          );
          const allUsers = await db.collection('registrations').get();
          let foundUser = null;

          for (const doc of allUsers.docs) {
            const data = doc.data();
            const userEmail =
              data.email || data.preferredEmail || data.user?.email || data.user?.preferredEmail;

            if (userEmail && userEmail.toLowerCase() === normalizedEmail) {
              foundUser = doc;
              break;
            }
          }

          if (foundUser) {
            userQuery = { docs: [foundUser], empty: false } as any;
          }
        }

        if (userQuery.empty) {
          console.log('[UpdateSponsor] ⚠️ Manager email not found:', normalizedEmail);
          continue;
        }

        const userDoc = userQuery.docs[0];
        const userData = userDoc.data();

        // Get user's current permissions (support both flat and nested structure)
        let userPermissions = userData?.permissions || userData?.user?.permissions || [];

        // Ensure permissions is an array
        if (!Array.isArray(userPermissions)) {
          userPermissions = [];
        }

        // Add 'sponsor' permission if not already present
        if (!userPermissions.includes('sponsor')) {
          userPermissions.push('sponsor');

          // Update user's permissions in Firestore
          if (userData?.user) {
            // Nested structure: update user.permissions
            await userDoc.ref.update({
              'user.permissions': userPermissions,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            // Flat structure: update permissions directly
            await userDoc.ref.update({
              permissions: userPermissions,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          }

          console.log('[UpdateSponsor] ✅ Added sponsor permission to user:', normalizedEmail);
        } else {
          console.log('[UpdateSponsor] ℹ️ User already has sponsor permission:', normalizedEmail);
        }

        console.log('[UpdateSponsor] Creating mapping:', {
          email: normalizedEmail,
          userId: userDoc.id,
          sponsorId,
          role: 'admin',
          updatedPermissions: userPermissions,
        });

        // Create mapping with 'admin' role (full edit permissions)
        await db.collection('sponsor-user-mappings').add({
          userId: userDoc.id,
          sponsorId: sponsorId,
          role: 'admin',
          email: normalizedEmail,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: userId,
        });
      }

      console.log('[UpdateSponsor] Successfully processed', managers.length, 'managers');
    }

    // 9. Update sponsor document
    await sponsorDoc.ref.update(updateData);

    // 10. Log activity
    try {
      await db.collection('sponsor-activity-logs').add({
        userId: userId,
        action: 'update_sponsor',
        resourceType: 'sponsor',
        resourceId: sponsorId,
        sponsorName: name.trim(),
        changes: updateData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error('[UpdateSponsor] Failed to log activity:', logError);
    }

    console.log('[UpdateSponsor] Successfully updated sponsor:', sponsorId);

    return res.status(200).json({
      success: true,
      message: `贊助商 ${name.trim()} 已成功更新`,
      sponsor: {
        id: sponsorId,
        ...updateData,
      },
    });
  } catch (error: any) {
    console.error('[UpdateSponsor] Error:', error);
    return res.status(500).json({
      error: '服務器錯誤',
      details: error.message,
    });
  }
}
