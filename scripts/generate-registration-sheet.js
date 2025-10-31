const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match && match[1].startsWith('SERVICE_ACCOUNT_')) {
    process.env[match[1]] = match[2];
  }
});

// Initialize Firebase
if (!admin.apps.length) {
  let privateKey = process.env.SERVICE_ACCOUNT_PRIVATE_KEY;
  if (privateKey && (privateKey.startsWith('"') || privateKey.startsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
      clientEmail: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();

async function generateRegistrationSheet() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  生成報到單 PDF                                         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // 獲取所有團隊
    const teamsSnapshot = await db.collection('team-registrations').get();
    
    if (teamsSnapshot.empty) {
      console.log('⚠️  資料庫中沒有團隊資料');
      return;
    }

    console.log(`📊 找到 ${teamsSnapshot.size} 個團隊\n`);

    // 收集所有成員資料
    const allMembers = [];
    let teamNumber = 1;

    teamsSnapshot.forEach((doc) => {
      const team = doc.data();
      const teamId = doc.id;
      
      // 添加隊長資訊（有姓名或有郵箱就添加）
      if (team.teamLeader && (team.teamLeader.name || team.teamLeader.email)) {
        const name = team.teamLeader.name && team.teamLeader.name.trim() 
          ? team.teamLeader.name.trim() 
          : '未填寫姓名';
        const email = team.teamLeader.email && team.teamLeader.email.trim()
          ? team.teamLeader.email.trim()
          : '';
        
        allMembers.push({
          teamNumber,
          teamId,
          teamName: team.teamName || '未命名團隊',
          name: name,
          email: email,
          registeredAt: team.createdAt,
        });
      }

      // 添加團隊成員資訊（有姓名或有郵箱就添加）
      if (team.teamMembers && Array.isArray(team.teamMembers)) {
        team.teamMembers.forEach((member) => {
          if (member.name || member.email) {
            const name = member.name && member.name.trim() 
              ? member.name.trim() 
              : '未填寫姓名';
            const email = member.email && member.email.trim()
              ? member.email.trim()
              : '';
            
            allMembers.push({
              teamNumber,
              teamId,
              teamName: team.teamName || '未命名團隊',
              name: name,
              email: email,
              registeredAt: team.createdAt,
            });
          }
        });
      }

      teamNumber++;
    });

    console.log(`👥 總計 ${allMembers.length} 位參賽者\n`);

    // 按團隊編號排序
    allMembers.sort((a, b) => {
      return a.teamNumber - b.teamNumber;
    });

    // 生成 PDF
    const outputPath = path.join(__dirname, '../registration-sheet.pdf');
    const fontPath = path.join(__dirname, '../fonts/NotoSansCJKtc-Regular.otf');
    
    const doc = new PDFDocument({ 
      size: 'A4', 
      margin: 40,
      bufferPages: true
    });
    
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    
    // 創建 Promise 以等待檔案寫入完成
    const finishPromise = new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // 註冊中文字體
    doc.registerFont('NotoSansCJK', fontPath);
    doc.font('NotoSansCJK');

    // 標題
    doc.fontSize(20).text('RWA 黑客松 2025 - 報到單', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`生成時間: ${new Date().toLocaleString('zh-TW')}`, { align: 'center' });
    doc.fontSize(12).text(`總團隊數: ${teamsSnapshot.size} | 總人數: ${allMembers.length}`, { align: 'center' });
    doc.moveDown(2);

    // 表格設定
    const tableTop = doc.y;
    const rowHeight = 25;
    const colWidths = {
      no: 40,
      team: 140,
      name: 100,
      email: 180,
      signature: 75,
    };

    // 繪製表頭
    let currentY = tableTop;
    doc.fontSize(10);
    
    const drawTableHeader = () => {
      let currentX = 40;
      doc.font('NotoSansCJK');
      
      // 繪製表頭背景
      doc.rect(currentX, currentY, 
        colWidths.no + colWidths.team + colWidths.name + 
        colWidths.email + colWidths.signature, 
        rowHeight
      ).fillAndStroke('#1a3a6e', '#000000');
      
      doc.fillColor('#ffffff');
      
      // 表頭文字
      doc.text('序號', currentX + 5, currentY + 8, { width: colWidths.no, align: 'center' });
      currentX += colWidths.no;
      
      doc.text('團隊名稱', currentX + 5, currentY + 8, { width: colWidths.team, align: 'center' });
      currentX += colWidths.team;
      
      doc.text('姓名', currentX + 5, currentY + 8, { width: colWidths.name, align: 'center' });
      currentX += colWidths.name;
      
      doc.text('電子郵箱', currentX + 5, currentY + 8, { width: colWidths.email, align: 'center' });
      currentX += colWidths.email;
      
      doc.text('簽名', currentX + 5, currentY + 8, { width: colWidths.signature, align: 'center' });
      
      currentY += rowHeight;
      doc.fillColor('#000000');
      doc.font('NotoSansCJK');
    };

    drawTableHeader();

    // 繪製資料行
    allMembers.forEach((member, index) => {
      // 檢查是否需要新頁面（留足夠空間給當前行）
      if (currentY + rowHeight > doc.page.height - 50) {
        doc.addPage();
        currentY = 40;
        drawTableHeader();
      }

      let currentX = 40;
      
      // 繪製行背景
      const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
      doc.rect(currentX, currentY, 
        colWidths.no + colWidths.team + colWidths.name + 
        colWidths.email + colWidths.signature, 
        rowHeight
      ).fillAndStroke(bgColor, '#d1d5db');
      
      doc.fillColor('#000000');
      doc.fontSize(9);
      
      // 序號
      doc.text(String(index + 1), currentX + 5, currentY + 8, { 
        width: colWidths.no - 10, 
        align: 'center' 
      });
      currentX += colWidths.no;
      
      // 團隊名稱
      doc.text(member.teamName, currentX + 5, currentY + 8, { 
        width: colWidths.team - 10, 
        align: 'left',
        ellipsis: true 
      });
      currentX += colWidths.team;
      
      // 姓名
      doc.text(member.name, currentX + 5, currentY + 8, { 
        width: colWidths.name - 10, 
        align: 'left',
        ellipsis: true 
      });
      currentX += colWidths.name;
      
      // 電子郵箱
      doc.text(member.email, currentX + 5, currentY + 8, { 
        width: colWidths.email - 10, 
        align: 'left',
        ellipsis: true 
      });
      currentX += colWidths.email;
      
      // 簽名欄（空白）
      // 已由邊框繪製
      
      currentY += rowHeight;
    });

    // 獲取實際使用的頁數
    const currentPageNumber = doc.bufferedPageRange().count;
    
    // 添加頁腳到所有頁面
    for (let i = 0; i < currentPageNumber; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(
        `第 ${i + 1} 頁，共 ${currentPageNumber} 頁`,
        40,
        doc.page.height - 30,
        { align: 'center' }
      );
    }

    doc.end();
    
    // 等待檔案寫入完成
    await finishPromise;

    console.log(`✅ PDF 報到單已生成: ${outputPath}\n`);
    console.log('📋 報到單包含以下資訊:');
    console.log('   - 序號');
    console.log('   - 團隊名稱');
    console.log('   - 姓名');
    console.log('   - 電子郵箱');
    console.log('   - 簽名欄');
    console.log(`\n📄 總頁數: ${currentPageNumber} 頁\n`);

  } catch (error) {
    console.error('❌ 錯誤:', error);
    throw error;
  }
}

// 執行腳本
generateRegistrationSheet()
  .then(() => {
    console.log('✅ 完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 失敗:', error);
    process.exit(1);
  });

