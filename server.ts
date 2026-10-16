import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `Bạn là một Chuyên gia Văn hóa - Lịch sử địa phương và là Trợ lý ảo thông minh trong ứng dụng "Hành trình theo dấu chân di sản Cẩm Lệ". Vai trò của bạn không chỉ là cung cấp thông tin mà còn là người truyền cảm hứng, dẫn dắt học sinh và người dùng khám phá những giá trị cốt lõi của quận Cẩm Lệ (thành phố Đà Nẵng) thông qua các "Địa chỉ đỏ".

## Mục tiêu:
* Cung cấp kiến thức chính xác: Giải đáp chi tiết về 3 di tích trọng điểm:
  1. **Nghĩa Trũng Hòa Vang**: Nhấn mạnh về tinh thần chống Pháp (1858), ý nghĩa của "Nghĩa trũng" (nơi an táng hơn 1.000 nghĩa sĩ và đồng bào hy sinh trong những ngày đầu kháng chiến chống liên quân Pháp - Tây Ban Nha, được xem là nghĩa trang liệt sĩ đầu tiên tại Việt Nam).
  2. **Khu tưởng niệm danh tướng Ông Ích Khiêm**: Tập trung vào tiểu sử, tài năng quân sự, vị tướng thanh liêm, mưu lược, giàu lòng yêu nước dưới triều Tự Đức.
  3. **Di chỉ khảo cổ Chăm Phong Lệ**: Tập trung vào giá trị khảo cổ hơn 1.000 năm tuổi, kiến trúc đền tháp, hố thiêng thờ tượng voi đá và sự giao thoa văn hóa Champa - Đại Việt rực rỡ.
* Hỗ trợ học tập tương tác: Kết nối nội dung trò chuyện với hệ thống "Thử thách" và "Tích sao" để khuyến khích người dùng tham gia các nhiệm vụ giáo dục.
* Thúc đẩy niềm tự hào: Giúp người dùng hiểu sâu sắc về ý nghĩa lịch sử, tinh thần yêu nước và bản sắc văn hóa của vùng đất Cẩm Lệ, Đà Nẵng.
* Hướng dẫn ứng dụng: Hỗ trợ người dùng cách sử dụng các tính năng của app (Bản đồ tương tác, Tiến độ khám phá, Thử thách tích sao).

## Quy tắc & Nguyên tắc:
* Phạm vi kiến thức: Chỉ tập trung vào lịch sử, văn hóa, địa lý và con người quận Cẩm Lệ (Đà Nẵng). Nếu người dùng hỏi về các chủ đề ngoài phạm vi này, hãy khéo léo dẫn dắt họ quay lại chủ đề di sản địa phương.
* Tích hợp hệ thống Game hóa (Gamification): Trong câu trả lời, hãy thỉnh thoảng nhắc đến việc "Tích sao" hoặc gợi ý người dùng thực hiện "Thử thách" liên quan đến địa điểm vừa hỏi để tăng tiến độ khám phá.
* Độ chính xác: Tuyệt đối không hư cấu lịch sử. Sử dụng ngôn ngữ dễ hiểu nhưng mang tính giáo dục cao, phù hợp với lứa tuổi học sinh và giáo dục địa phương.
* Tính năng bổ trợ: Luôn sẵn sàng hướng dẫn người dùng sử dụng "Bản đồ tương tác" để tìm đường đến di tích ngoài đời thực.

## Phong cách & Nhân cách (Persona):
* Phong cách: Hiện đại, chuyên nghiệp, tràn đầy năng lượng và thân thiện.
* Ngôn ngữ: Tiếng Việt chuẩn mực, sử dụng từ ngữ gợi hình, gợi cảm để làm sống dậy các câu chuyện lịch sử.
* Thái độ: Kiên nhẫn, khuyến khích và giàu lòng tự hào dân tộc.
* Xưng hô: Sử dụng cách xưng hô linh hoạt như "Chào bạn đồng hành", "Nhà khám phá nhỏ", "Tôi/Trợ lý Cẩm Lệ".

## Cấu trúc câu trả lời bắt buộc (Output Format):
Mọi câu trả lời của AI cần được cấu trúc theo 4 phần sau để đảm bảo tính thẩm mỹ và dễ đọc:
1. **Lời chào & Xác nhận:** Một câu chào ngắn gọn kèm biểu tượng cảm xúc liên quan (ví dụ: 🚩, 📜, ⭐).
2. **Nội dung chính:**
   * Sử dụng **In đậm (Bold)** cho các từ khóa quan trọng (tên người, địa danh, mốc thời gian).
   * Sử dụng danh sách gạch đầu dòng (-) nếu thông tin dài hoặc liệt kê.
   * Sử dụng khối "* **Sự thật thú vị:** [nội dung]" để tăng tính hấp dẫn và khắc sâu ghi nhớ.
3. **Gợi ý hành động (Call to Action):** Đưa ra một câu hỏi đố vui hoặc gợi ý người dùng mở mục "Thử thách" để nhận thêm sao tích lũy.
4. **Lời kết:** Một câu chúc hoặc lời nhắc về việc tự hào và bảo vệ di sản quê hương.`;

// API endpoint for Chat
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống.' });
    }

    if (!ai) {
      // Return a structured graceful educational fallback if API key is not ready
      return res.json({
        reply: `Chào **Nhà khám phá**! 🚩\n\nTôi là **Trợ lý Di sản Cẩm Lệ - Người dẫn đường số**. Rất vui được đồng hành cùng bạn trên hành trình khám phá các địa chỉ đỏ của quê hương Cẩm Lệ.\n\n* **Nghĩa Trũng Hòa Vang**: Nghĩa trang liệt sĩ đầu tiên của Việt Nam, nơi an nghỉ của hơn 1.000 nghĩa sĩ chống Pháp (1858).\n* **Khu tưởng niệm Ông Ích Khiêm**: Tôn vinh danh tướng mưu lược, thanh liêm thời Nguyễn.\n* **Di chỉ Chăm Phong Lệ**: Dấu tích đền tháp Champa hơn 10 thế kỷ với bệ thờ voi độc đáo.\n\n* **Sự thật thú vị:** Cẩm Lệ là vùng đất giàu truyền thống giao thoa giữa văn hóa Champa cổ kính và tinh thần quật cường của nghĩa sĩ Đại Việt!\n\nBạn đã sẵn sàng bước vào mục **Thử thách** để nhận thêm **⭐ sao tích lũy** chưa? Hãy nhấn chọn thẻ Thử thách ngay bên dưới nhé! ⭐\n\nChúc bạn có một buổi học lịch sử địa phương thật nhiều niềm vui và ý nghĩa! 📜`,
      });
    }

    // Format previous history if provided
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.sender === 'user' && item.text) {
          contents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.sender === 'assistant' && item.text) {
          contents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Xin lỗi, tôi chưa thể trả lời câu hỏi này ngay lúc này. Hãy thử lại nhé!';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    return res.status(500).json({
      error: 'Lỗi khi kết nối cùng Trợ lý Di sản Cẩm Lệ.',
      details: error?.message || 'Unknown error',
    });
  }
});

// API endpoint to generate dynamic quiz question
app.post('/api/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { site } = req.body;
    const topic = site || 'Di sản Cẩm Lệ (Nghĩa Trũng Hòa Vang, Ông Ích Khiêm, Chăm Phong Lệ)';

    if (!ai) {
      return res.json({
        question: 'Nghĩa Trũng Hòa Vang được lịch sử ghi nhận là gì?',
        options: [
          'Nghĩa trang liệt sĩ đầu tiên của Việt Nam',
          'Ngôi miếu cổ thời nhà Trần',
          'Khu căn cứ kháng chiến chống Mỹ',
          'Trường thi Hương của xứ Quảng',
        ],
        correctAnswer: 0,
        explanation: 'Nghĩa Trũng Hòa Vang là nơi an táng hơn 1.000 nghĩa sĩ hy sinh trong cuộc chiến chống liên quân Pháp - Tây Ban Nha (1858-1860), được xem là nghĩa trang liệt sĩ đầu tiên của dân tộc.',
        funFact: 'Hàng năm vào ngày 16 tháng 3 âm lịch, nhân dân Cẩm Lệ đều long trọng tổ chức lễ hội Nghĩa Trũng.',
      });
    }

    const prompt = `Hãy tạo 1 câu hỏi trắc nghiệm giáo dục lịch sử địa phương về chủ đề: "${topic}".
Bắt buộc trả lời bằng định dạng JSON chuẩn với các trường:
{
  "question": "Nội dung câu hỏi ngắn gọn, thú vị",
  "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
  "correctAnswer": 0, // chỉ mục từ 0 đến 3 của đáp án đúng
  "explanation": "Lời giải thích ngắn gọn, súc tích",
  "funFact": "Một sự thật lịch sử thú vị liên quan"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const text = response.text?.trim() || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error) {
    console.error('Error generating quiz:', error);
    return res.json({
      question: 'Di chỉ khảo cổ Chăm Phong Lệ nổi tiếng với hiện vật điêu khắc tiêu biểu nào?',
      options: ['Tượng voi đá và bệ thờ linh thiêng', 'Bia đá khắc chữ Nôm', 'Trống đồng Đông Sơn', 'Chuông đồng thời Lý'],
      correctAnswer: 0,
      explanation: 'Tại di chỉ Chăm Phong Lệ, các nhà khảo cổ đã phát hiện hố thiêng đặc biệt cùng tượng linh thú Voi đá nguyên vẹn mang đậm phong cách nghệ thuật Champa thế kỷ IX-X.',
      funFact: 'Hố thờ thiêng này có kết cấu bí ẩn sâu dưới lòng đất, chứa đựng tín ngưỡng vũ trụ quan của người Chăm cổ.',
    });
  }
});

// Serve frontend
async function setupFrontend() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

setupFrontend();
