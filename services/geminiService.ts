
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const processPatternImage = async (base64Image: string): Promise<{ templateImage: string, description: string }> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // 清理 base64 字符串
  const imageData = base64Image.split(',')[1];

  const prompt = `
    任务：将此照片中的图案精准提取，并还原为【无边距、色彩零偏差、规整矩形】的专业印刷平面模版。
    
    核心执行标准：
    1. 【色彩零偏差】：严禁改变任何颜色。输出图像的每一处色值必须与原图中相应位置的颜色完全匹配，保持原始设计的色相、明度和饱和度。
    2. 【边缘与透明处理】：图案以外的所有区域必须剪裁掉。如果是无法剪裁的空白处，请处理为纯净、平整的透明背景（或与原图底色完全一致的纯色），严禁出现白边或杂色边角。
    3. 【正交矩形展平】：通过数字透视矫正，将照片中的褶皱、倾斜和弯曲彻底消除。输出结果必须是一个边缘绝对平直的标准矩形（90度直角），看起来像是原始的数字设计文件。
    4. 【彻底移除杂质】：移除手指、阴影、反光、背景杂物以及布料边缘的所有物理痕迹，仅保留纯净的图案内容。
    5. 【印刷就绪】：输出图像必须是满幅的，无任何外围边框。

    输出格式：提供一张视角完全垂直、无任何边距、图案内容严丝合缝填满全幅的高清规整矩形图片。
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  let templateImage = "";
  let description = "已完成高精度提取：色彩锁定、透视矫正、强制剪裁无边距。";

  if (response.candidates && response.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        templateImage = `data:image/png;base64,${part.inlineData.data}`;
      } else if (part.text) {
        description = part.text;
      }
    }
  }

  if (!templateImage) {
    throw new Error("生成模版失败，请确保原图图案清晰且光照均匀。");
  }

  return { templateImage, description };
};
