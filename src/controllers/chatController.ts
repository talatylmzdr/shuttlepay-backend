import { Request, Response } from 'express';
import Fuse from 'fuse.js';

// 1. CHATBOT'UN BEYNİ: SORU - CEVAP VERİTABANI
const knowledgeBase = [
  {
    id: "sefer_saatleri",
    keywords: ["saat", "kalkış", "ne zaman", "hareket", "ring saatleri", "kaçta"],
    answer: "Ring seferlerimiz hafta içi her gün 07:45 - 19:15 saatleri arasında, Maslak Dereboyu durağından doldukça hareket etmektedir. 🚌"
  },
  {
    id: "bakiye_yukleme",
    keywords: ["bakiye", "para yükleme", "nasıl yüklerim", "kredi kartı", "yükle", "para atma"],
    answer: "Ana sayfadaki 'Bakiye Yükle' butonunu kullanarak sisteme güvenli bir şekilde kredi kartınızla bakiye ekleyebilirsiniz. 💳"
  },
  {
    id: "kayip_esya",
    keywords: ["kayıp", "eşya", "unuttum", "çanta", "cüzdan", "bulundu"],
    answer: "Geçmiş olsun. Unutulan eşyalar gün sonunda Merkez Kampüs Güvenlik noktasına (A Blok Girişi) teslim edilmektedir. 🎒"
  },
  {
    id: "nish_card",
    keywords: ["kart", "nish card", "geçiş", "turnike", "okutma", "çalışmıyor"],
    answer: "ShuttlePay'e yüklediğiniz bakiyeyi kullanmak için fiziksel Nish Card'ınızı durağımızdaki turnikeye okutmanız yeterlidir. Geçiş ücreti anında bakiyenizden düşer."
  },
  {
    id: "selamlasma",
    keywords: ["merhaba", "selam", "naber", "nasılsın", "hey"],
    answer: "Merhaba! Ben ShuttlePay asistanın. Sana sefer saatleri, bakiye yükleme veya turnike geçişleri hakkında nasıl yardımcı olabilirim? 🦄"
  }
];

// 2. ARAMA MOTORU AYARLARI
const fuseOptions = {
  keys: ['keywords'],
  threshold: 0.4,
  includeScore: true
};

const fuse = new Fuse(knowledgeBase, fuseOptions);

// 3. İSTEĞİ KARŞILAYAN FONKSİYON
export const handleChatMessage = (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, reply: "Boş mesaj gönderilemez." });
  }

  const results = fuse.search(message);

  if (results.length > 0 && results[0].score && results[0].score <= 0.6) {
    return res.json({ 
      success: true, 
      reply: results[0].item.answer 
    });
  } else {
    return res.json({ 
      success: true, 
      reply: "Bunu tam anlayamadım. Bana sefer saatlerini, nasıl bakiye yükleneceğini veya kayıp eşyaları sorabilirsin. 🤔" 
    });
  }
};