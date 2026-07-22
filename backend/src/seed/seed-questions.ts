import "../lib/env.js";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  classifyQuestionDifficulty,
  getWeightFromPriority,
} from "../lib/question-difficulty.js";
import type {
  AnswerOption,
  TryoutStatus,
  WeightPriority,
} from "../types/domain.js";

const LEGACY_BIOLOGY_PREFIX = "[TEST-BIO-SMA]";

const BIOLOGY_PREFIX = "[SEED-BIOLOGI-ADMIN]";
const BINDO_PREFIX = "[SEED-BINDO-X-TEACHER]";
const PRAMUKA_PREFIX = "[SEED-PRAMUKA-BOYMAN-TEACHER]";

const BIOLOGY_TRYOUT_TITLE = "[SEED] Tryout Biologi SMA - Admin";
const BINDO_TRYOUT_TITLE = "[SEED] Tryout Bahasa Indonesia Kelas 10 - Guru";
const PRAMUKA_TRYOUT_TITLE = "[SEED] Tryout Pramuka Boyman Bab 1-2 - Guru";

type QuestionSource = {
  text: string;
  correct: string;
  distractors: [string, string, string];
  weightPriority: WeightPriority;
};

type RawQuestion = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: AnswerOption;
  weightPriority: WeightPriority;
};

type SeedTarget = {
  ownerEmail: string;
  subjectName: string;
  prefix: string;
  tryoutTitle: string;
  sources: QuestionSource[];
  totalQuestions: number;
  durationMinutes: number;
  maxAttempts: number | null;
  status: TryoutStatus;
};

const answerOptions: AnswerOption[] = ["A", "B", "C", "D"];

const biologySources: QuestionSource[] = [
  // 1-10: Sel dan metabolisme
  {
    text: "Apa fungsi utama klorofil pada proses fotosintesis?",
    correct: "Menyerap energi cahaya matahari",
    distractors: [
      "Mengangkut air dari akar ke daun",
      "Menyimpan cadangan makanan pada batang",
      "Menghasilkan karbon dioksida dari glukosa",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Organel sel yang berfungsi sebagai tempat respirasi sel adalah...",
    correct: "Mitokondria",
    distractors: ["Ribosom", "Vakuola", "Kloroplas"],
    weightPriority: "LOW",
  },
  {
    text: "Apa fungsi ribosom pada sel?",
    correct: "Tempat sintesis protein",
    distractors: [
      "Tempat penyimpanan air",
      "Tempat respirasi sel",
      "Tempat fotosintesis",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa fungsi membran sel?",
    correct: "Mengatur keluar masuknya zat secara selektif",
    distractors: [
      "Menghasilkan energi cahaya",
      "Membentuk urine primer",
      "Mengangkut air dari akar",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi inti sel pada sel eukariotik?",
    correct: "Mengatur aktivitas sel dan menyimpan materi genetik",
    distractors: [
      "Mencerna lemak di usus",
      "Mengangkut oksigen dalam darah",
      "Menghasilkan sel kelamin secara langsung",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa pengertian osmosis?",
    correct: "Perpindahan air melalui membran semipermeabel",
    distractors: [
      "Perpindahan oksigen melalui hemoglobin",
      "Pembentukan protein di ribosom",
      "Pemecahan glukosa oleh cahaya",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa pengertian difusi?",
    correct: "Perpindahan zat dari konsentrasi tinggi ke konsentrasi rendah",
    distractors: [
      "Pengangkutan zat yang selalu membutuhkan ATP",
      "Pembentukan urine di kandung kemih",
      "Pewarisan sifat dari lingkungan ke gen",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa perbedaan utama transpor aktif dan transpor pasif?",
    correct: "Transpor aktif membutuhkan energi, transpor pasif tidak",
    distractors: [
      "Transpor aktif tidak pernah terjadi pada sel hidup",
      "Transpor pasif selalu melawan gradien konsentrasi",
      "Keduanya selalu membutuhkan energi ATP",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa tujuan respirasi sel?",
    correct: "Menghasilkan energi dalam bentuk ATP",
    distractors: [
      "Menghasilkan antibodi",
      "Mengangkut air ke daun",
      "Menghasilkan sel kelamin",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa yang terjadi pada enzim jika suhu terlalu tinggi?",
    correct: "Struktur enzim dapat berubah sehingga aktivitasnya menurun",
    distractors: [
      "Enzim selalu bekerja semakin cepat tanpa batas",
      "Enzim berubah menjadi antibodi",
      "Enzim menjadi kromosom",
    ],
    weightPriority: "HIGH",
  },

  // 11-20: Tumbuhan
  {
    text: "Jaringan tumbuhan yang mengangkut air dari akar ke daun adalah...",
    correct: "Xilem",
    distractors: ["Floem", "Epidermis", "Parenkim"],
    weightPriority: "LOW",
  },
  {
    text: "Jaringan tumbuhan yang mengangkut hasil fotosintesis adalah...",
    correct: "Floem",
    distractors: ["Xilem", "Epidermis", "Kolenkim"],
    weightPriority: "LOW",
  },
  {
    text: "Apa fungsi stomata pada daun?",
    correct: "Mengatur pertukaran gas dan penguapan air",
    distractors: [
      "Menghasilkan sel kelamin jantan",
      "Mengangkut hasil fotosintesis",
      "Menyerap mineral langsung dari tanah",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi kloroplas pada sel tumbuhan?",
    correct: "Tempat berlangsungnya fotosintesis",
    distractors: [
      "Tempat respirasi anaerob",
      "Tempat pembentukan urine",
      "Tempat pertukaran gas di paru-paru",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Zat utama yang dihasilkan tumbuhan dalam fotosintesis adalah...",
    correct: "Glukosa",
    distractors: ["Urea", "Asam laktat", "Hemoglobin"],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa tanaman di tempat gelap dapat tumbuh tinggi tetapi pucat?",
    correct: "Tanaman mengalami etiolasi karena kekurangan cahaya",
    distractors: [
      "Tanaman menghasilkan lebih banyak klorofil",
      "Tanaman berhenti melakukan respirasi",
      "Tanaman kehilangan semua jaringan meristem",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa peran nitrogen bagi pertumbuhan tanaman?",
    correct: "Mendukung pembentukan protein dan pertumbuhan vegetatif",
    distractors: [
      "Menggantikan fungsi cahaya matahari",
      "Menghambat pembentukan jaringan meristem",
      "Mengubah xilem menjadi floem",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa yang dimaksud transpirasi pada tumbuhan?",
    correct: "Penguapan air dari permukaan tumbuhan terutama melalui stomata",
    distractors: [
      "Masuknya oksigen ke alveolus",
      "Pembentukan antibodi oleh limfosit",
      "Pemisahan kromosom saat meiosis",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa angin dapat meningkatkan laju transpirasi?",
    correct: "Angin mempercepat penguapan air dari permukaan daun",
    distractors: [
      "Angin menghentikan kerja stomata permanen",
      "Angin mengubah floem menjadi xilem",
      "Angin membuat akar tidak menyerap air sama sekali",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa perbedaan monokotil dan dikotil berdasarkan keping bijinya?",
    correct: "Monokotil satu keping biji, dikotil dua keping biji",
    distractors: [
      "Monokotil dua keping biji, dikotil satu keping biji",
      "Keduanya tidak memiliki biji",
      "Keduanya selalu berkembang biak dengan spora",
    ],
    weightPriority: "LOW",
  },

  // 21-30: Sistem organ manusia
  {
    text: "Apa fungsi alveolus pada sistem pernapasan manusia?",
    correct: "Tempat pertukaran gas oksigen dan karbon dioksida",
    distractors: [
      "Tempat produksi sel darah merah",
      "Tempat penyaringan urine",
      "Tempat pembentukan empedu",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi hemoglobin dalam darah?",
    correct: "Mengikat dan mengangkut oksigen",
    distractors: [
      "Menghasilkan antibodi",
      "Menguraikan makanan",
      "Menghasilkan hormon insulin",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi eritrosit dalam tubuh manusia?",
    correct: "Mengangkut oksigen ke jaringan tubuh",
    distractors: [
      "Menghasilkan antibodi",
      "Membekukan darah",
      "Menghasilkan hormon reproduksi",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Bagian ginjal yang berperan dalam pembentukan urine adalah...",
    correct: "Nefron",
    distractors: ["Alveolus", "Vili", "Bronkiolus"],
    weightPriority: "LOW",
  },
  {
    text: "Bagian nefron yang berperan dalam filtrasi darah adalah...",
    correct: "Glomerulus",
    distractors: ["Ureter", "Uretra", "Kandung kemih"],
    weightPriority: "HIGH",
  },
  {
    text: "Apa yang terjadi pada proses reabsorpsi di nefron?",
    correct: "Zat yang masih dibutuhkan tubuh diserap kembali ke darah",
    distractors: [
      "Oksigen ditukar dengan karbon dioksida",
      "Protein disintesis oleh ribosom",
      "Darah dipompa menuju paru-paru",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Sistem saraf pusat tersusun atas...",
    correct: "Otak dan sumsum tulang belakang",
    distractors: [
      "Jantung dan pembuluh darah",
      "Paru-paru dan alveolus",
      "Lambung dan usus halus",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa hubungan sinapsis dengan penghantaran impuls saraf?",
    correct:
      "Sinapsis menjadi tempat perpindahan impuls melalui neurotransmiter",
    distractors: [
      "Sinapsis menyaring urine primer",
      "Sinapsis menghasilkan sel darah merah",
      "Sinapsis mengangkut air di xilem",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi jaringan epitel pada tubuh manusia?",
    correct: "Melindungi permukaan tubuh dan organ",
    distractors: [
      "Mengangkut impuls saraf",
      "Menghasilkan sel kelamin",
      "Menyaring darah di ginjal",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa frekuensi napas meningkat saat seseorang berolahraga?",
    correct: "Kebutuhan oksigen dan pembuangan karbon dioksida meningkat",
    distractors: [
      "Otot berhenti membutuhkan energi",
      "Ginjal menghentikan pembentukan urine",
      "Kadar oksigen tubuh selalu menjadi nol",
    ],
    weightPriority: "NORMAL",
  },

  // 31-40: Hormon, imun, reproduksi
  {
    text: "Apa fungsi hormon insulin?",
    correct: "Membantu menurunkan kadar glukosa darah",
    distractors: [
      "Meningkatkan kadar oksigen darah",
      "Menghasilkan empedu",
      "Mengatur pertukaran gas di paru-paru",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa gangguan insulin dapat menyebabkan kadar gula darah tinggi?",
    correct: "Glukosa sulit masuk ke sel sehingga tetap tinggi dalam darah",
    distractors: [
      "Insulin berfungsi sebagai pengangkut oksigen",
      "Glukosa darah diatur oleh stomata",
      "Insulin diproduksi oleh alveolus",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa umpan balik negatif penting dalam sistem hormon?",
    correct: "Menjaga kadar hormon tetap stabil",
    distractors: [
      "Menghentikan seluruh metabolisme tubuh",
      "Mengubah hormon menjadi antibodi",
      "Hanya terjadi pada tumbuhan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa fungsi hormon tiroid secara umum?",
    correct: "Mengatur laju metabolisme tubuh",
    distractors: [
      "Menyaring darah di ginjal",
      "Mengangkut oksigen seperti hemoglobin",
      "Membentuk klorofil pada tumbuhan",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi antibodi dalam sistem kekebalan tubuh?",
    correct: "Mengenali dan melawan antigen",
    distractors: [
      "Mengangkut oksigen",
      "Menguraikan karbohidrat",
      "Membentuk dinding sel",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa tujuan pemberian vaksin?",
    correct: "Merangsang pembentukan kekebalan terhadap penyakit tertentu",
    distractors: [
      "Menggantikan fungsi seluruh sel darah putih",
      "Meningkatkan jumlah air dalam tubuh",
      "Menghentikan seluruh aktivitas metabolisme",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa yang dimaksud kekebalan kelompok?",
    correct: "Kondisi ketika banyak individu kebal sehingga penularan menurun",
    distractors: [
      "Kondisi ketika semua eritrosit hilang",
      "Kondisi ketika tumbuhan membentuk antibodi",
      "Kondisi ketika vaksin menghilangkan semua penyakit sekaligus",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Apa nama sel kelamin betina pada manusia?",
    correct: "Ovum",
    distractors: ["Sperma", "Zigot", "Embrio"],
    weightPriority: "LOW",
  },
  {
    text: "Apa nama sel kelamin jantan pada manusia?",
    correct: "Sperma",
    distractors: ["Ovum", "Plasenta", "Uterus"],
    weightPriority: "LOW",
  },
  {
    text: "Apa fungsi plasenta pada kehamilan?",
    correct: "Menghubungkan pertukaran zat antara ibu dan janin",
    distractors: [
      "Menghasilkan sperma",
      "Mencerna makanan janin",
      "Menyaring urine janin secara langsung",
    ],
    weightPriority: "NORMAL",
  },

  // 41-50: Genetika
  {
    text: "Apa fungsi DNA pada makhluk hidup?",
    correct: "Menyimpan informasi genetik",
    distractors: [
      "Menghasilkan energi secara langsung",
      "Membentuk dinding sel tumbuhan",
      "Mencerna lemak di usus halus",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa pengertian gen?",
    correct: "Unit pewarisan sifat pada makhluk hidup",
    distractors: [
      "Tempat pertukaran gas",
      "Jaringan pengangkut air",
      "Organ pencernaan makanan",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa pengertian kromosom?",
    correct: "Struktur pembawa materi genetik di dalam sel",
    distractors: [
      "Tempat penyerapan air di usus besar",
      "Enzim pemecah karbohidrat",
      "Saluran pengangkut urine",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa perbedaan genotipe dan fenotipe?",
    correct: "Genotipe adalah susunan gen, fenotipe adalah sifat yang tampak",
    distractors: [
      "Genotipe adalah organ, fenotipe adalah jaringan",
      "Genotipe hanya dimiliki bakteri",
      "Fenotipe tidak dipengaruhi gen",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa golongan darah anak dapat berbeda dari orang tuanya?",
    correct: "Anak menerima kombinasi alel dari ayah dan ibu",
    distractors: [
      "Darah anak dibentuk oleh klorofil",
      "Golongan darah hanya ditentukan makanan",
      "Golongan darah tidak dipengaruhi gen",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa dampak mutasi gen terhadap protein?",
    correct: "Mutasi dapat mengubah kodon sehingga susunan asam amino berubah",
    distractors: [
      "Mutasi selalu mengubah air menjadi glukosa",
      "Mutasi hanya terjadi pada xilem",
      "Mutasi tidak pernah memengaruhi protein",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa perbedaan utama mitosis dan meiosis berdasarkan jumlah sel anak?",
    correct:
      "Mitosis menghasilkan dua sel anak, meiosis menghasilkan empat sel anak",
    distractors: [
      "Mitosis menghasilkan empat sel anak, meiosis menghasilkan dua",
      "Keduanya menghasilkan satu sel anak",
      "Keduanya tidak menghasilkan sel anak",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Apa hubungan DNA dan RNA dalam sintesis protein?",
    correct:
      "DNA menyimpan informasi, RNA membantu membawa dan menerjemahkannya",
    distractors: [
      "DNA membentuk membran sel, RNA membentuk dinding sel",
      "DNA hanya ada di ribosom, RNA hanya ada di mitokondria",
      "DNA dan RNA tidak berperan dalam sintesis protein",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa yang dapat dianalisis dari silsilah keluarga penyakit genetik?",
    correct: "Kemungkinan pola pewarisan dominan atau resesif",
    distractors: [
      "Jenis makanan harian seluruh keluarga",
      "Jumlah air dalam sel tumbuhan",
      "Kadar oksigen dalam alveolus",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Apa akibat pembelahan sel yang tidak terkendali?",
    correct: "Terbentuknya massa jaringan abnormal seperti tumor",
    distractors: [
      "Terbentuknya xilem baru pada hewan",
      "Hilangnya semua jaringan tubuh",
      "Berhentinya seluruh proses metabolisme",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 51-60: Mikroorganisme dan bioteknologi
  {
    text: "Apa ciri utama virus?",
    correct: "Hanya dapat berkembang biak di dalam sel hidup",
    distractors: [
      "Selalu memiliki inti sel",
      "Dapat membuat makanan sendiri",
      "Memiliki klorofil untuk fotosintesis",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa ciri umum bakteri?",
    correct: "Bersifat prokariotik karena tidak memiliki membran inti",
    distractors: [
      "Selalu bersifat multiseluler",
      "Memiliki jaringan kompleks",
      "Selalu melakukan fotosintesis",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa antibiotik tidak sesuai aturan dapat memicu resistensi bakteri?",
    correct: "Bakteri yang tahan dapat bertahan hidup dan berkembang biak",
    distractors: [
      "Antibiotik mengubah bakteri menjadi virus",
      "Antibiotik membuat bakteri memiliki klorofil",
      "Bakteri berhenti metabolisme selamanya",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa peran bakteri dalam fermentasi makanan?",
    correct: "Mengubah bahan organik menjadi produk fermentasi",
    distractors: [
      "Selalu merusak semua makanan",
      "Menghasilkan cahaya untuk fotosintesis",
      "Membentuk jaringan epitel",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Bagaimana virus bereplikasi secara umum di dalam sel inang?",
    correct: "Memasukkan materi genetik dan memanfaatkan sel inang",
    distractors: [
      "Membelah diri seperti sel manusia",
      "Membuat makanan melalui klorofil",
      "Menyaring urine di nefron",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa bakteri dapat digunakan dalam bioremediasi?",
    correct: "Bakteri tertentu dapat menguraikan senyawa pencemar",
    distractors: [
      "Bakteri selalu memperbanyak minyak",
      "Bakteri mengubah minyak menjadi klorofil",
      "Bakteri tidak memiliki metabolisme",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa prinsip dasar kultur jaringan tanaman?",
    correct: "Memanfaatkan kemampuan sel tanaman membentuk individu baru",
    distractors: [
      "Menghentikan pembelahan sel tanaman",
      "Hanya dilakukan pada hewan vertebrata",
      "Tidak membutuhkan kondisi steril",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa manfaat tanaman transgenik tahan hama?",
    correct:
      "Dapat mengurangi penggunaan pestisida dengan tetap perlu kajian ekologis",
    distractors: [
      "Selalu menghentikan fotosintesis",
      "Tidak memiliki DNA",
      "Hanya hidup di tubuh hewan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa penyebab utama munculnya bakteri resisten di rumah sakit?",
    correct: "Seleksi terhadap bakteri yang tahan antibiotik",
    distractors: [
      "Bakteri tidak memiliki DNA",
      "Antibiotik mengubah semua bakteri menjadi virus",
      "Antibiotik selalu menambah bakteri baik",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Apa fungsi mikroorganisme pengurai dalam pengolahan limbah?",
    correct: "Menguraikan bahan organik menjadi zat yang lebih sederhana",
    distractors: [
      "Mengubah oksigen menjadi nitrogen langsung",
      "Membentuk jaringan saraf",
      "Menghilangkan semua air di lingkungan",
    ],
    weightPriority: "NORMAL",
  },

  // 61-70: Ekologi dasar
  {
    text: "Apa pengertian ekosistem?",
    correct: "Interaksi antara makhluk hidup dan lingkungannya",
    distractors: [
      "Kumpulan jaringan yang membentuk organ",
      "Proses pembentukan energi dalam sel",
      "Pewarisan sifat dari induk",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa peran produsen dalam ekosistem?",
    correct:
      "Menghasilkan bahan organik melalui fotosintesis atau kemosintesis",
    distractors: [
      "Menguraikan sisa organisme",
      "Memakan konsumen tingkat dua",
      "Menghasilkan antibodi",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa peran dekomposer dalam ekosistem?",
    correct: "Menguraikan sisa makhluk hidup menjadi zat sederhana",
    distractors: [
      "Menghasilkan oksigen dari hemoglobin",
      "Mengangkut air melalui xilem",
      "Mengatur kadar gula darah",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa energi berkurang pada tingkat trofik berikutnya?",
    correct:
      "Sebagian energi digunakan untuk aktivitas hidup dan hilang sebagai panas",
    distractors: [
      "Energi bertambah pada setiap tingkat trofik",
      "Energi tidak berpindah dalam rantai makanan",
      "Produsen selalu memiliki energi paling sedikit",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa hubungan produsen, konsumen, dan dekomposer dalam aliran energi?",
    correct:
      "Produsen membentuk bahan organik, konsumen memanfaatkannya, dekomposer menguraikan sisa",
    distractors: [
      "Produsen hanya memakan konsumen",
      "Dekomposer menghasilkan cahaya",
      "Konsumen membuat glukosa langsung dari cahaya",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa pengertian seleksi alam?",
    correct:
      "Bertahannya individu yang memiliki sifat paling sesuai dengan lingkungan",
    distractors: [
      "Perpindahan air melalui membran",
      "Pembentukan protein oleh ribosom",
      "Pengangkutan oksigen oleh hemoglobin",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa hubungan adaptasi dan seleksi alam?",
    correct:
      "Individu dengan adaptasi sesuai memiliki peluang hidup lebih besar",
    distractors: [
      "Adaptasi menghentikan reproduksi",
      "Seleksi alam hanya terjadi pada batuan",
      "Adaptasi tidak berhubungan dengan lingkungan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa yang dimaksud daya dukung lingkungan?",
    correct: "Kemampuan lingkungan menyediakan sumber daya bagi populasi",
    distractors: [
      "Kemampuan hewan menghasilkan klorofil",
      "Jumlah kromosom dalam sel",
      "Kecepatan darah membawa oksigen",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa daya dukung membatasi pertumbuhan populasi?",
    correct: "Sumber daya seperti makanan, ruang, dan air terbatas",
    distractors: [
      "Populasi tidak membutuhkan sumber daya",
      "Daya dukung selalu membuat populasi tetap",
      "Lingkungan tidak memengaruhi organisme",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa dampak spesies asing invasif pada ekosistem lokal?",
    correct:
      "Dapat menekan populasi lokal dan mengganggu keseimbangan ekosistem",
    distractors: [
      "Selalu meningkatkan semua populasi lokal",
      "Tidak pernah bersaing dengan spesies lokal",
      "Hanya memengaruhi batuan",
    ],
    weightPriority: "HIGH",
  },

  // 71-80: Lingkungan
  {
    text: "Mengapa pencemaran air dapat menurunkan kadar oksigen terlarut?",
    correct:
      "Penguraian bahan pencemar meningkatkan penggunaan oksigen oleh mikroorganisme",
    distractors: [
      "Pencemaran selalu menambah oksigen",
      "Oksigen terlarut tidak dibutuhkan organisme air",
      "Mikroorganisme tidak menggunakan oksigen",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa dampak ledakan alga akibat peningkatan nitrat di danau?",
    correct: "Menurunkan oksigen terlarut dan mengganggu organisme air",
    distractors: [
      "Selalu menurunkan jumlah alga",
      "Tidak memengaruhi kadar oksigen",
      "Organisme air tidak butuh oksigen",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Apa dampak penggunaan pestisida berlebihan pada ekosistem sawah?",
    correct:
      "Membunuh organisme non-target dan mengganggu keseimbangan populasi",
    distractors: [
      "Hanya membunuh tanaman padi",
      "Meningkatkan semua predator langsung",
      "Tidak memengaruhi organisme lain",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa hubungan deforestasi dan siklus air?",
    correct:
      "Deforestasi mengurangi penyerapan air tanah dan meningkatkan risiko banjir",
    distractors: [
      "Deforestasi meningkatkan akar penyerap air",
      "Hutan tidak berperan dalam siklus air",
      "Deforestasi selalu menurunkan aliran permukaan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa dampak erosi tanah terhadap lahan pertanian?",
    correct: "Menghilangkan lapisan tanah subur sehingga produktivitas menurun",
    distractors: [
      "Selalu menambah unsur hara",
      "Tidak memengaruhi akar tanaman",
      "Membuat semua tanaman tumbuh lebih cepat",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa strategi konservasi yang tepat untuk spesies terancam punah yang berbagi habitat?",
    correct: "Melindungi habitat utama dan mengurangi gangguan manusia",
    distractors: [
      "Menghilangkan seluruh vegetasi",
      "Memindahkan predator tanpa kajian",
      "Mengabaikan tempat hidup spesies",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa yang terjadi pada suksesi sekunder setelah kebakaran hutan?",
    correct:
      "Rumput dan semak dapat tumbuh lebih dahulu karena tanah masih tersedia",
    distractors: [
      "Dimulai dari batuan tanpa tanah",
      "Terjadi fermentasi karena cahaya meningkat",
      "Selalu membuat ekosistem tidak pulih",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa dampak suhu laut tinggi terhadap terumbu karang?",
    correct:
      "Mengganggu simbiosis karang dan alga sehingga karang kekurangan energi",
    distractors: [
      "Selalu meningkatkan pertumbuhan karang",
      "Karang tidak membutuhkan simbion",
      "Karang menghasilkan hemoglobin",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa hubungan tumbuhan dengan siklus karbon?",
    correct: "Tumbuhan menyerap karbon dioksida saat fotosintesis",
    distractors: [
      "Tumbuhan menghasilkan semua karbon dioksida",
      "Tumbuhan tidak berperan dalam siklus karbon",
      "Tumbuhan mengubah karbon langsung menjadi nitrogen",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa hubungan populasi predator dan mangsa?",
    correct: "Ketersediaan mangsa dapat memengaruhi jumlah predator",
    distractors: [
      "Predator tidak dipengaruhi mangsa",
      "Mangsa selalu meningkat saat predator meningkat",
      "Predator menghasilkan makanan untuk produsen",
    ],
    weightPriority: "HIGH",
  },

  // 81-90: Analisis kasus
  {
    text: "Jika membran sel rusak, apa dampaknya bagi keseimbangan zat dalam sel?",
    correct:
      "Sel kehilangan kemampuan mengatur keluar masuknya zat secara selektif",
    distractors: [
      "Sel lebih mampu menghasilkan klorofil",
      "Sel langsung berubah menjadi jaringan",
      "Sel tidak mengalami perubahan fungsi",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jika grafik kerja enzim menurun setelah suhu optimum, penyebabnya adalah...",
    correct: "Struktur enzim berubah sehingga sisi aktif tidak sesuai substrat",
    distractors: [
      "Enzim berubah menjadi antibodi",
      "Substrat berubah menjadi membran sel",
      "Enzim selalu maksimal pada suhu tinggi",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jika populasi bakteri meningkat cepat setelah fase adaptasi, fase tersebut adalah...",
    correct: "Fase eksponensial",
    distractors: [
      "Fase kematian",
      "Fase stasioner awal",
      "Fase dormansi permanen",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Jika pasien gagal ginjal mengalami penumpukan zat sisa metabolisme, penyebabnya adalah...",
    correct: "Ginjal gagal menyaring darah dan membuang zat sisa melalui urine",
    distractors: [
      "Ginjal gagal menghasilkan cahaya",
      "Ginjal mengubah oksigen menjadi karbon dioksida",
      "Ginjal berhenti membentuk hemoglobin",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa pendaki di dataran tinggi dapat meningkatkan produksi sel darah merah?",
    correct: "Untuk meningkatkan kapasitas pengangkutan oksigen",
    distractors: [
      "Untuk menghasilkan empedu",
      "Untuk menurunkan kemampuan membawa oksigen",
      "Karena tubuh tidak membutuhkan hemoglobin",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa hubungan respirasi anaerob dan asam laktat pada otot saat olahraga berat?",
    correct:
      "Saat oksigen terbatas, otot menghasilkan energi melalui fermentasi asam laktat",
    distractors: [
      "Asam laktat terbentuk dari klorofil",
      "Respirasi anaerob hanya terjadi di alveolus",
      "Otot tidak membutuhkan energi",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jika fotosintesis tidak meningkat meski cahaya ditambah, kemungkinan penyebabnya adalah...",
    correct: "Faktor lain seperti karbon dioksida atau suhu menjadi pembatas",
    distractors: [
      "Cahaya satu-satunya faktor fotosintesis",
      "Fotosintesis tidak membutuhkan karbon dioksida",
      "Suhu tidak memengaruhi enzim",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Jika serangga berwarna mirip lingkungan lebih jarang dimangsa, proses yang terjadi adalah...",
    correct: "Seleksi alam terhadap variasi yang menguntungkan",
    distractors: [
      "Variasi genetik tidak memengaruhi hidup",
      "Semua individu berubah sama dalam satu hari",
      "Burung tidak dapat memberi tekanan seleksi",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Jika pola makan tidak seimbang, metabolisme tubuh dapat terganggu karena...",
    correct: "Asupan zat gizi memengaruhi energi, hormon, dan kerja organ",
    distractors: [
      "Makanan tidak berpengaruh pada sel",
      "Metabolisme hanya terjadi pada tumbuhan",
      "Zat gizi selalu menghambat enzim",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa akibat jika glomerulus rusak pada proses pembentukan urine?",
    correct:
      "Filtrasi darah terganggu sehingga pembentukan urine primer bermasalah",
    distractors: [
      "Uretra menyerap glukosa lebih banyak",
      "Kandung kemih membentuk antibodi",
      "Alveolus berhenti menukar gas",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 91-100: Konsep lanjutan
  {
    text: "Apa hubungan enzim dan substrat menurut konsep spesifisitas enzim?",
    correct: "Bentuk sisi aktif enzim sesuai dengan substrat tertentu",
    distractors: [
      "Enzim selalu bekerja pada semua substrat",
      "Enzim tidak memiliki bentuk tertentu",
      "Enzim hanya mengangkut oksigen",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa manfaat homeostasis bagi tubuh?",
    correct: "Menjaga kondisi internal agar tetap stabil",
    distractors: [
      "Menghentikan seluruh metabolisme",
      "Mengubah semua hormon menjadi antibodi",
      "Membuat sel tidak membutuhkan energi",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Bagaimana beberapa sistem organ menjaga homeostasis?",
    correct: "Sistem organ bekerja sama mengatur kondisi internal tubuh",
    distractors: [
      "Sistem organ bekerja sendiri tanpa hubungan",
      "Homeostasis hanya terjadi pada virus",
      "Sistem organ selalu menghentikan metabolisme",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa perbedaan imunitas humoral dan seluler?",
    correct: "Humoral melibatkan antibodi, seluler melibatkan sel T",
    distractors: [
      "Keduanya hanya melibatkan eritrosit",
      "Humoral terjadi di ginjal",
      "Seluler hanya terjadi pada tumbuhan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa jenis respons imun saat sel T menghancurkan sel tubuh yang terinfeksi virus?",
    correct: "Imunitas seluler",
    distractors: ["Transpirasi", "Filtrasi", "Fotosintesis"],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Apa fungsi estrogen dan progesteron dalam siklus menstruasi?",
    correct: "Mengatur perubahan dinding rahim dan siklus reproduksi",
    distractors: [
      "Mengangkut oksigen dalam darah",
      "Memecah karbohidrat di mulut",
      "Menyaring darah di glomerulus",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa hubungan penyerbukan dengan pembentukan biji?",
    correct:
      "Penyerbukan memindahkan serbuk sari ke kepala putik sehingga memungkinkan pembuahan",
    distractors: [
      "Penyerbukan memecah glukosa menjadi ATP",
      "Penyerbukan menyaring darah di ginjal",
      "Penyerbukan membentuk antibodi pada hewan",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa pengaruh kelembapan tinggi terhadap transpirasi?",
    correct: "Kelembapan tinggi menurunkan penguapan air dari daun",
    distractors: [
      "Selalu meningkatkan transpirasi tanpa batas",
      "Hanya memengaruhi warna bunga",
      "Mengubah xilem menjadi floem",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa hubungan osmosis dan plasmolisis pada sel tumbuhan?",
    correct:
      "Plasmolisis terjadi saat air keluar dari sel pada lingkungan hipertonik",
    distractors: [
      "Plasmolisis terjadi saat sel membelah",
      "Osmosis hanya terjadi pada sel hewan",
      "Plasmolisis mengubah kloroplas menjadi mitokondria",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa hubungan hormon auksin dan fototropisme?",
    correct: "Distribusi auksin memengaruhi pertumbuhan batang ke arah cahaya",
    distractors: [
      "Auksin memecah protein menjadi asam amino",
      "Auksin menyaring darah di ginjal",
      "Auksin membentuk antibodi",
    ],
    weightPriority: "HIGH",
  },

  // 101-110: Pendalaman
  {
    text: "Apa yang dimaksud faktor pembatas dalam fotosintesis?",
    correct:
      "Faktor yang jumlahnya paling kurang sehingga membatasi laju fotosintesis",
    distractors: [
      "Faktor yang selalu mempercepat fotosintesis tanpa batas",
      "Faktor yang hanya dimiliki hewan",
      "Faktor yang tidak pernah memengaruhi tumbuhan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa respirasi sel tetap penting bagi tumbuhan?",
    correct: "Tumbuhan tetap membutuhkan ATP untuk aktivitas selnya",
    distractors: [
      "Tumbuhan tidak pernah melakukan respirasi",
      "Respirasi hanya terjadi pada hewan",
      "Fotosintesis menggantikan semua kebutuhan energi sel",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa akibat kekurangan air bagi proses fotosintesis?",
    correct:
      "Fotosintesis dapat menurun karena air merupakan salah satu bahan baku",
    distractors: [
      "Fotosintesis meningkat tanpa batas",
      "Air tidak diperlukan dalam fotosintesis",
      "Klorofil berubah menjadi hemoglobin",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa fungsi vili pada usus halus?",
    correct: "Memperluas permukaan penyerapan sari makanan",
    distractors: [
      "Menyaring darah menjadi urine",
      "Menghasilkan oksigen",
      "Mengatur impuls saraf",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi trombosit dalam darah?",
    correct: "Membantu proses pembekuan darah",
    distractors: [
      "Menghasilkan empedu",
      "Menyerap air dari tanah",
      "Membentuk glukosa",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa fungsi leukosit dalam tubuh?",
    correct: "Membantu pertahanan tubuh terhadap infeksi",
    distractors: [
      "Mengangkut hasil fotosintesis",
      "Menghasilkan klorofil",
      "Menyaring urine di uretra",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa yang dimaksud habitat?",
    correct: "Tempat hidup suatu organisme",
    distractors: [
      "Proses pembentukan protein",
      "Bagian inti sel",
      "Jenis jaringan darah",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa yang dimaksud populasi dalam ekologi?",
    correct:
      "Sekumpulan individu sejenis yang hidup di tempat dan waktu tertentu",
    distractors: [
      "Gabungan semua organ dalam tubuh",
      "Bagian sel yang menyimpan DNA",
      "Zat hasil respirasi anaerob",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa yang dimaksud komunitas dalam ekologi?",
    correct: "Kumpulan berbagai populasi yang hidup di suatu tempat",
    distractors: [
      "Kumpulan molekul air dalam sel",
      "Jaringan pengangkut pada tumbuhan",
      "Organ reproduksi pada manusia",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa yang dimaksud rantai makanan?",
    correct: "Urutan perpindahan energi melalui proses makan dan dimakan",
    distractors: [
      "Urutan pembentukan urine",
      "Urutan pembelahan inti sel saja",
      "Urutan pengangkutan oksigen oleh hemoglobin",
    ],
    weightPriority: "NORMAL",
  },

  // 111-120: HOTS
  {
    text: "Jika suatu ekosistem kehilangan predator puncak, apa dampak yang mungkin terjadi?",
    correct:
      "Populasi mangsa dapat meningkat dan mengganggu keseimbangan ekosistem",
    distractors: [
      "Semua populasi pasti langsung punah",
      "Produsen berhenti melakukan fotosintesis",
      "Dekomposer berubah menjadi predator",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa penggunaan pupuk berlebihan dapat menyebabkan eutrofikasi?",
    correct: "Nutrien berlebih memicu ledakan alga di perairan",
    distractors: [
      "Pupuk selalu menurunkan alga",
      "Pupuk menghilangkan semua bakteri",
      "Pupuk mengubah ikan menjadi tumbuhan",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Jika seseorang kekurangan hemoglobin, dampak utamanya adalah...",
    correct: "Kemampuan darah mengangkut oksigen menurun",
    distractors: [
      "Kemampuan stomata membuka meningkat",
      "Pembentukan glukosa bertambah",
      "Kadar klorofil darah meningkat",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jika sel ditempatkan pada larutan hipertonik, apa yang terjadi pada air di dalam sel?",
    correct: "Air cenderung keluar dari sel",
    distractors: [
      "Air selalu masuk ke sel tanpa batas",
      "Air berubah menjadi protein",
      "Air tidak bergerak sama sekali",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jika sel tumbuhan kehilangan tekanan turgor, kondisi tanaman dapat menjadi...",
    correct: "Layu",
    distractors: [
      "Lebih hijau",
      "Lebih keras permanen",
      "Berubah menjadi hewan",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa mutasi tidak selalu merugikan organisme?",
    correct:
      "Sebagian mutasi dapat netral atau memberi keuntungan pada kondisi tertentu",
    distractors: [
      "Semua mutasi pasti mematikan",
      "Mutasi tidak pernah memengaruhi gen",
      "Mutasi hanya terjadi pada batu",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa dampak hilangnya keanekaragaman hayati?",
    correct: "Stabilitas ekosistem dapat menurun",
    distractors: [
      "Ekosistem selalu menjadi lebih stabil",
      "Tidak ada dampak bagi lingkungan",
      "Semua organisme menjadi produsen",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa yang dimaksud suksesi primer?",
    correct:
      "Perkembangan ekosistem pada tempat baru yang belum memiliki tanah",
    distractors: [
      "Pemulihan ekosistem yang masih memiliki tanah",
      "Pembelahan sel menjadi empat gamet",
      "Perpindahan air melalui membran",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa yang dimaksud suksesi sekunder?",
    correct:
      "Pemulihan komunitas setelah gangguan pada area yang masih memiliki tanah",
    distractors: [
      "Pembentukan tanah pertama pada batuan kosong",
      "Pembentukan protein oleh RNA",
      "Pengangkutan oksigen oleh alveolus",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa data eksperimen perlu menggunakan kelompok kontrol?",
    correct: "Agar hasil perlakuan dapat dibandingkan secara objektif",
    distractors: [
      "Agar semua data menjadi sama",
      "Agar variabel bebas hilang",
      "Agar percobaan tidak membutuhkan pengamatan",
    ],
    weightPriority: "VERY_HIGH",
  },
];

const bahasaIndonesiaSources: QuestionSource[] = [
  // 1-10: Teks laporan hasil observasi
  {
    text: "Apa tujuan utama teks laporan hasil observasi?",
    correct: "Menyampaikan informasi faktual berdasarkan hasil pengamatan",
    distractors: [
      "Menceritakan pengalaman pribadi secara imajinatif",
      "Membujuk pembaca membeli suatu produk",
      "Menyampaikan konflik tokoh dalam cerita",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Bagian awal teks laporan hasil observasi biasanya berisi...",
    correct: "Pernyataan umum atau klasifikasi objek yang diamati",
    distractors: [
      "Dialog antartokoh",
      "Resolusi konflik",
      "Ajakan membeli barang",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Ciri bahasa teks laporan hasil observasi adalah...",
    correct: "Objektif, faktual, dan menggunakan istilah sesuai bidangnya",
    distractors: [
      "Penuh ungkapan perasaan pribadi",
      "Selalu menggunakan bahasa gaul",
      "Mengandung tokoh antagonis dan protagonis",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Kalimat definisi dalam teks laporan hasil observasi digunakan untuk...",
    correct: "Menjelaskan pengertian atau batasan suatu objek",
    distractors: [
      "Menyatakan ajakan",
      "Menunjukkan konflik batin tokoh",
      "Mengakhiri percakapan",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Contoh kata kerja relasional dalam teks laporan hasil observasi adalah...",
    correct: "Merupakan",
    distractors: ["Berlari", "Membeli", "Menendang"],
    weightPriority: "LOW",
  },
  {
    text: "Apa yang dimaksud objektif dalam penulisan laporan observasi?",
    correct: "Informasi disajikan sesuai fakta, bukan pendapat pribadi",
    distractors: [
      "Informasi dibuat agar lucu",
      "Informasi harus berupa dialog",
      "Informasi hanya berdasarkan dugaan",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Struktur deskripsi bagian dalam laporan observasi berfungsi untuk...",
    correct: "Menjelaskan rincian bagian, ciri, atau sifat objek",
    distractors: [
      "Menawarkan produk kepada pembaca",
      "Menyampaikan amanat cerita",
      "Menyusun rima puisi",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa data observasi harus dicatat dengan teliti?",
    correct: "Agar laporan yang dibuat akurat dan dapat dipertanggungjawabkan",
    distractors: [
      "Agar teks menjadi fiksi",
      "Agar pembaca bingung",
      "Agar informasi tidak perlu dicek",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Kalimat 'Kucing adalah hewan mamalia berkaki empat' termasuk...",
    correct: "Kalimat definisi",
    distractors: ["Kalimat perintah", "Kalimat seruan", "Kalimat tanya"],
    weightPriority: "LOW",
  },
  {
    text: "Apa perbedaan fakta dan opini dalam teks laporan?",
    correct: "Fakta dapat dibuktikan, opini berupa pendapat",
    distractors: [
      "Fakta selalu salah, opini selalu benar",
      "Fakta hanya terdapat pada cerpen",
      "Opini selalu disertai data ilmiah",
    ],
    weightPriority: "HIGH",
  },

  // 11-20: Teks eksposisi
  {
    text: "Apa tujuan utama teks eksposisi?",
    correct: "Menjelaskan pendapat atau gagasan disertai argumen",
    distractors: [
      "Menceritakan kisah fantasi",
      "Menyusun dialog drama",
      "Mencatat hasil pengamatan tanpa pendapat",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Struktur teks eksposisi secara umum adalah...",
    correct: "Tesis, argumentasi, penegasan ulang",
    distractors: [
      "Orientasi, komplikasi, resolusi",
      "Abstrak, orientasi, koda",
      "Pembuka, isi surat, salam penutup",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Bagian tesis dalam teks eksposisi berisi...",
    correct: "Pernyataan pendapat atau gagasan utama penulis",
    distractors: [
      "Penyelesaian konflik tokoh",
      "Daftar alat dan bahan",
      "Kesimpulan hasil wawancara saja",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi argumentasi dalam teks eksposisi?",
    correct: "Mendukung pendapat dengan alasan, data, atau contoh",
    distractors: [
      "Menggambarkan watak tokoh",
      "Mengubah teks menjadi puisi",
      "Menyembunyikan gagasan utama",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Kata 'selain itu', 'oleh karena itu', dan 'dengan demikian' termasuk...",
    correct: "Konjungsi atau penanda hubungan antargagasan",
    distractors: ["Kata sapaan", "Kata sandang tokoh", "Kata tiruan bunyi"],
    weightPriority: "NORMAL",
  },
  {
    text: "Bagaimana argumen yang baik dalam teks eksposisi?",
    correct: "Logis, relevan, dan didukung bukti",
    distractors: [
      "Tidak berhubungan dengan tesis",
      "Hanya berupa hinaan",
      "Selalu tanpa data",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa tujuan penegasan ulang dalam teks eksposisi?",
    correct: "Menegaskan kembali pendapat utama penulis",
    distractors: [
      "Memperkenalkan tokoh baru",
      "Menyampaikan latar tempat cerita",
      "Menyusun daftar pustaka",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Kalimat yang berisi pendapat penulis disebut...",
    correct: "Opini",
    distractors: ["Fakta", "Data statistik", "Kutipan langsung"],
    weightPriority: "LOW",
  },
  {
    text: "Mengapa teks eksposisi membutuhkan data pendukung?",
    correct: "Agar pendapat penulis lebih kuat dan meyakinkan",
    distractors: [
      "Agar teks menjadi dongeng",
      "Agar struktur hilang",
      "Agar pembaca tidak memahami isi",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Contoh topik yang cocok untuk teks eksposisi adalah...",
    correct: "Pentingnya menjaga kebersihan lingkungan sekolah",
    distractors: [
      "Petualangan tokoh di negeri ajaib",
      "Dialog dua sahabat di panggung",
      "Daftar belanja bulanan keluarga",
    ],
    weightPriority: "NORMAL",
  },

  // 21-30: Anekdot
  {
    text: "Apa ciri utama teks anekdot?",
    correct: "Cerita singkat yang lucu dan mengandung kritik atau sindiran",
    distractors: [
      "Laporan ilmiah tentang hewan",
      "Petunjuk penggunaan alat",
      "Daftar riwayat hidup",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Struktur umum teks anekdot adalah...",
    correct: "Abstraksi, orientasi, krisis, reaksi, koda",
    distractors: [
      "Tesis, argumentasi, penegasan ulang",
      "Definisi umum, deskripsi bagian, manfaat",
      "Salam pembuka, isi, salam penutup",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Bagian krisis dalam teks anekdot berisi...",
    correct: "Masalah lucu atau puncak kejadian yang disindir",
    distractors: [
      "Daftar pustaka",
      "Pengenalan istilah ilmiah",
      "Kesimpulan observasi",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Fungsi sindiran dalam teks anekdot adalah...",
    correct: "Menyampaikan kritik secara tidak langsung",
    distractors: [
      "Menghapus pesan moral",
      "Membuat teks menjadi prosedur",
      "Menggantikan seluruh fakta",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Kalimat langsung dalam anekdot biasanya ditandai dengan...",
    correct: "Tanda petik",
    distractors: ["Tanda persen", "Tanda sama dengan", "Tanda akar"],
    weightPriority: "LOW",
  },
  {
    text: "Apa perbedaan anekdot dengan humor biasa?",
    correct: "Anekdot tidak hanya lucu, tetapi juga memuat kritik atau pesan",
    distractors: [
      "Anekdot selalu tanpa tokoh",
      "Humor biasa selalu berupa laporan",
      "Anekdot tidak boleh menghibur",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Bagian orientasi dalam anekdot berfungsi untuk...",
    correct: "Memberi latar awal peristiwa atau tokoh",
    distractors: [
      "Menyatakan simpulan akhir laporan",
      "Menyusun daftar argumen",
      "Menjelaskan rumus matematika",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa yang dimaksud koda dalam teks anekdot?",
    correct: "Bagian penutup cerita",
    distractors: [
      "Bagian yang selalu berisi data tabel",
      "Bagian pembuka surat resmi",
      "Bagian daftar pustaka",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Mengapa anekdot sering menggunakan bahasa percakapan?",
    correct: "Agar cerita terasa hidup dan mudah dipahami",
    distractors: [
      "Agar isi menjadi laporan ilmiah",
      "Agar tidak memiliki tokoh",
      "Agar semua kalimat menjadi definisi",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Topik yang cocok untuk anekdot adalah...",
    correct: "Kebiasaan datang terlambat yang disindir lewat cerita lucu",
    distractors: [
      "Cara membuat pupuk kompos langkah demi langkah",
      "Klasifikasi tumbuhan paku",
      "Laporan hasil pengamatan pasar",
    ],
    weightPriority: "NORMAL",
  },

  // 31-40: Hikayat dan nilai
  {
    text: "Apa yang dimaksud hikayat?",
    correct:
      "Karya sastra lama berbentuk prosa yang berisi kisah istana atau kepahlawanan",
    distractors: [
      "Teks petunjuk penggunaan alat",
      "Laporan hasil percobaan",
      "Artikel ilmiah populer",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Salah satu ciri hikayat adalah...",
    correct: "Bersifat istanasentris dan banyak mengandung kemustahilan",
    distractors: [
      "Selalu memakai data statistik modern",
      "Tidak memiliki tokoh",
      "Hanya berisi daftar kata baku",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa yang dimaksud nilai moral dalam hikayat?",
    correct: "Ajaran tentang baik buruknya perilaku",
    distractors: [
      "Keterangan tempat dan waktu",
      "Jumlah paragraf dalam cerita",
      "Penggunaan huruf kapital",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Nilai sosial dalam hikayat berkaitan dengan...",
    correct: "Hubungan manusia dengan orang lain dalam masyarakat",
    distractors: [
      "Cara menghitung rima",
      "Jenis huruf yang digunakan",
      "Letak tanda baca saja",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi amanat dalam cerita?",
    correct: "Menyampaikan pesan yang dapat dipetik pembaca",
    distractors: [
      "Menentukan jumlah halaman",
      "Mengubah teks menjadi laporan",
      "Menghapus konflik",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa yang dimaksud alur dalam cerita?",
    correct: "Rangkaian peristiwa yang membentuk jalan cerita",
    distractors: [
      "Tempat terjadinya cerita saja",
      "Nama pengarang saja",
      "Ukuran huruf pada teks",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Tokoh yang memiliki watak baik dan mendukung cerita disebut...",
    correct: "Protagonis",
    distractors: ["Antagonis", "Figuran benda", "Latar"],
    weightPriority: "LOW",
  },
  {
    text: "Apa yang dimaksud latar dalam cerita?",
    correct: "Keterangan tempat, waktu, dan suasana peristiwa",
    distractors: [
      "Pesan moral cerita saja",
      "Daftar pustaka cerita",
      "Jenis paragraf argumentasi",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Mengapa hikayat dapat diubah menjadi cerpen modern?",
    correct:
      "Karena nilai dan peristiwa dapat disesuaikan dengan bahasa masa kini",
    distractors: [
      "Karena semua unsur cerita harus dihapus",
      "Karena hikayat tidak memiliki isi",
      "Karena cerpen tidak membutuhkan alur",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Saat mengadaptasi hikayat, hal yang perlu dipertahankan adalah...",
    correct: "Nilai penting atau pesan utama cerita",
    distractors: [
      "Semua kata lama tanpa perubahan",
      "Kesalahan ejaan",
      "Jumlah halaman asli",
    ],
    weightPriority: "HIGH",
  },

  // 41-50: Debat, kaidah bahasa, dan literasi
  {
    text: "Apa tujuan utama debat?",
    correct: "Mempertahankan pendapat dengan argumen yang logis",
    distractors: [
      "Menceritakan pengalaman pribadi",
      "Membacakan puisi secara bebas",
      "Menyusun laporan observasi saja",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Pihak yang mendukung mosi dalam debat disebut...",
    correct: "Tim afirmasi",
    distractors: ["Tim oposisi", "Moderator", "Notulis saja"],
    weightPriority: "LOW",
  },
  {
    text: "Pihak yang menolak mosi dalam debat disebut...",
    correct: "Tim oposisi",
    distractors: ["Tim afirmasi", "Penonton", "Pembawa acara"],
    weightPriority: "LOW",
  },
  {
    text: "Apa fungsi moderator dalam debat?",
    correct: "Mengatur jalannya debat agar tertib",
    distractors: [
      "Menentukan pemenang tanpa penilaian",
      "Menggantikan semua pembicara",
      "Membaca cerpen",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Argumen debat yang baik harus...",
    correct: "Didukung data, alasan logis, dan relevan dengan mosi",
    distractors: [
      "Berupa hinaan pribadi",
      "Tidak berkaitan dengan topik",
      "Selalu tanpa bukti",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa yang dimaksud kata baku?",
    correct: "Kata yang sesuai dengan kaidah bahasa Indonesia resmi",
    distractors: [
      "Kata yang selalu disingkat",
      "Kata yang hanya dipakai di media sosial",
      "Kata yang tidak memiliki makna",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Contoh penulisan kata baku yang tepat adalah...",
    correct: "Aktivitas",
    distractors: ["Aktifitas", "Aktivtas", "Aktiviti"],
    weightPriority: "LOW",
  },
  {
    text: "Apa fungsi membaca kritis?",
    correct: "Menilai isi teks, keakuratan informasi, dan maksud penulis",
    distractors: [
      "Menghafal semua tanda baca tanpa memahami isi",
      "Mengubah semua teks menjadi dialog",
      "Menghindari pemahaman gagasan utama",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Gagasan utama paragraf adalah...",
    correct: "Inti pembahasan dalam paragraf",
    distractors: [
      "Kalimat terakhir yang selalu berupa tanya",
      "Daftar tokoh dalam cerita",
      "Kata sulit dalam kamus",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Kesimpulan yang baik harus...",
    correct:
      "Sesuai dengan isi teks dan tidak menambahkan informasi yang bertentangan",
    distractors: [
      "Bertentangan dengan data teks",
      "Hanya berisi candaan",
      "Tidak berkaitan dengan topik",
    ],
    weightPriority: "HIGH",
  },
];

const pramukaSources: QuestionSource[] = [
  // 1-10: Dasar kepramukaan
  {
    text: "Apa tujuan utama pendidikan kepramukaan?",
    correct: "Membentuk karakter, keterampilan, dan kepedulian peserta didik",
    distractors: [
      "Menghapus kegiatan belajar di sekolah",
      "Mengutamakan perlombaan tanpa pembinaan",
      "Mengajarkan materi akademik saja",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Kepramukaan adalah proses pendidikan yang dilaksanakan di luar lingkungan sekolah dan keluarga dalam bentuk kegiatan...",
    correct: "Menarik, menyenangkan, sehat, teratur, terarah, dan praktis",
    distractors: [
      "Pasif, tertutup, dan hanya berupa hafalan",
      "Tanpa aturan dan tanpa tujuan",
      "Khusus untuk orang dewasa saja",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Gerakan Pramuka di Indonesia berfungsi sebagai...",
    correct: "Wadah pembinaan kaum muda melalui pendidikan kepramukaan",
    distractors: [
      "Lembaga perdagangan alat kemah",
      "Organisasi politik praktis",
      "Tempat mengganti pelajaran sekolah",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Pramuka merupakan singkatan dari...",
    correct: "Praja Muda Karana",
    distractors: [
      "Praktik Mandiri Karya",
      "Praja Mandiri Kuat",
      "Pemuda Rakyat Mandiri",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Makna umum Praja Muda Karana adalah...",
    correct: "Rakyat muda yang suka berkarya",
    distractors: [
      "Kelompok tua yang beristirahat",
      "Pasukan khusus perdagangan",
      "Perkumpulan tanpa kegiatan",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa fungsi prinsip dasar kepramukaan?",
    correct: "Menjadi landasan berpikir dan bertindak dalam kegiatan Pramuka",
    distractors: [
      "Menghilangkan aturan organisasi",
      "Mengganti seluruh kode kehormatan",
      "Membatasi peserta agar tidak belajar",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi metode kepramukaan?",
    correct: "Cara pelaksanaan pendidikan kepramukaan agar tujuan tercapai",
    distractors: [
      "Daftar hukuman bagi peserta",
      "Catatan keuangan organisasi saja",
      "Pengganti semua kegiatan praktik",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Kegiatan Pramuka sebaiknya dilakukan dengan prinsip...",
    correct: "Belajar sambil melakukan",
    distractors: [
      "Duduk diam tanpa praktik",
      "Menghafal tanpa pengalaman",
      "Bersaing tanpa kerja sama",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Sistem beregu dalam Pramuka bertujuan untuk...",
    correct: "Melatih kerja sama, tanggung jawab, dan kepemimpinan",
    distractors: [
      "Membuat peserta bekerja sendiri-sendiri",
      "Menghapus komunikasi antaranggota",
      "Menghilangkan peran pemimpin regu",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Kegiatan di alam terbuka dalam Pramuka bermanfaat untuk...",
    correct: "Melatih kemandirian, ketangguhan, dan kecintaan pada alam",
    distractors: [
      "Menghindari semua kegiatan fisik",
      "Membatasi peserta mengenal lingkungan",
      "Menghapus kerja sama dalam regu",
    ],
    weightPriority: "HIGH",
  },

  // 11-20: Sejarah dan organisasi
  {
    text: "Tokoh dunia yang dikenal sebagai pendiri gerakan kepanduan adalah...",
    correct: "Robert Baden-Powell",
    distractors: ["Ki Hadjar Dewantara", "Ir. Soekarno", "Mohammad Hatta"],
    weightPriority: "LOW",
  },
  {
    text: "Buku yang ditulis Baden-Powell dan menjadi dasar kepanduan dunia adalah...",
    correct: "Scouting for Boys",
    distractors: ["Das Kapital", "Max Havelaar", "Laskar Pelangi"],
    weightPriority: "LOW",
  },
  {
    text: "Apa manfaat mempelajari sejarah kepanduan?",
    correct: "Memahami nilai, perkembangan, dan semangat gerakan Pramuka",
    distractors: [
      "Menghafal tahun tanpa memahami makna",
      "Menghapus tradisi organisasi",
      "Menghindari kegiatan berkelompok",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Gerakan Pramuka Indonesia ditetapkan sebagai satu-satunya organisasi kepanduan melalui...",
    correct: "Keputusan Presiden Republik Indonesia",
    distractors: ["Peraturan kelas", "Keputusan regu", "Kesepakatan pasar"],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi gugus depan dalam Gerakan Pramuka?",
    correct: "Satuan organisasi terdepan tempat peserta didik berlatih",
    distractors: [
      "Tempat menyimpan arsip negara",
      "Lembaga perdagangan seragam",
      "Kantor pemerintahan pusat",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Pembina Pramuka bertugas untuk...",
    correct: "Membimbing peserta didik dalam kegiatan kepramukaan",
    distractors: [
      "Menggantikan seluruh peran peserta",
      "Membatasi kegiatan regu",
      "Menjual perlengkapan pribadi",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Peserta didik dalam Gerakan Pramuka dibina sesuai...",
    correct: "Golongan usia dan tingkat perkembangannya",
    distractors: [
      "Warna sepatu saja",
      "Jumlah uang saku",
      "Jenis makanan favorit",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Golongan Pramuka Siaga umumnya diperuntukkan bagi anak usia...",
    correct: "7 sampai 10 tahun",
    distractors: [
      "16 sampai 20 tahun",
      "21 sampai 25 tahun",
      "30 tahun ke atas",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Golongan Pramuka Penggalang umumnya diperuntukkan bagi anak usia...",
    correct: "11 sampai 15 tahun",
    distractors: [
      "7 sampai 10 tahun",
      "21 sampai 25 tahun",
      "30 tahun ke atas",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Golongan Pramuka Penegak umumnya diperuntukkan bagi remaja usia...",
    correct: "16 sampai 20 tahun",
    distractors: [
      "7 sampai 10 tahun",
      "11 sampai 15 tahun",
      "30 tahun ke atas",
    ],
    weightPriority: "LOW",
  },

  // 21-30: Kode kehormatan
  {
    text: "Kode kehormatan Pramuka terdiri dari...",
    correct: "Satya dan Darma Pramuka",
    distractors: [
      "Absensi dan nilai rapor",
      "Tata tertib kelas dan jadwal piket",
      "Daftar lomba dan hadiah",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi Trisatya bagi anggota Pramuka?",
    correct: "Menjadi janji yang mengikat perilaku anggota Pramuka",
    distractors: [
      "Menjadi daftar perlengkapan kemah",
      "Menjadi rumus matematika",
      "Menjadi nama regu saja",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi Dasa Darma Pramuka?",
    correct: "Menjadi pedoman moral dan sikap anggota Pramuka",
    distractors: [
      "Menggantikan semua kegiatan latihan",
      "Menjadi daftar harga seragam",
      "Menentukan nilai ujian sekolah",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Sikap takwa kepada Tuhan Yang Maha Esa dalam Dasa Darma menunjukkan nilai...",
    correct: "Religius",
    distractors: ["Komersial", "Individualis", "Pasif"],
    weightPriority: "LOW",
  },
  {
    text: "Sikap cinta alam dan kasih sayang sesama manusia berarti anggota Pramuka harus...",
    correct: "Peduli terhadap lingkungan dan sesama",
    distractors: [
      "Merusak lingkungan saat berkemah",
      "Mengabaikan teman yang membutuhkan",
      "Hanya peduli pada diri sendiri",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Darma 'patriot yang sopan dan kesatria' menekankan perilaku...",
    correct: "Cinta tanah air, santun, dan berani membela kebenaran",
    distractors: [
      "Menghindari tanggung jawab",
      "Mementingkan diri sendiri",
      "Bersikap kasar kepada orang lain",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Darma 'patuh dan suka bermusyawarah' mengajarkan anggota Pramuka untuk...",
    correct: "Taat aturan dan menyelesaikan masalah melalui musyawarah",
    distractors: [
      "Memaksakan kehendak pribadi",
      "Menolak semua keputusan bersama",
      "Menghindari diskusi regu",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Darma 'rela menolong dan tabah' berarti anggota Pramuka harus...",
    correct: "Membantu orang lain dan tetap kuat menghadapi kesulitan",
    distractors: [
      "Menunggu imbalan sebelum menolong",
      "Mudah menyerah saat menghadapi tugas",
      "Mengabaikan teman yang kesulitan",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Darma 'rajin, terampil, dan gembira' berkaitan dengan sikap...",
    correct: "Aktif belajar, memiliki kecakapan, dan bersemangat",
    distractors: [
      "Malas berlatih dan sering mengeluh",
      "Menolak keterampilan baru",
      "Bekerja tanpa tanggung jawab",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa kode kehormatan penting dalam kegiatan Pramuka?",
    correct: "Agar anggota memiliki pedoman sikap dalam kehidupan sehari-hari",
    distractors: [
      "Agar kegiatan tidak memiliki arah",
      "Agar peserta tidak perlu bertanggung jawab",
      "Agar regu tidak perlu bekerja sama",
    ],
    weightPriority: "HIGH",
  },

  // 31-40: Lambang dan identitas
  {
    text: "Lambang Gerakan Pramuka Indonesia adalah...",
    correct: "Tunas kelapa",
    distractors: ["Padi dan kapas", "Burung garuda", "Bintang laut"],
    weightPriority: "LOW",
  },
  {
    text: "Makna tunas kelapa sebagai lambang Pramuka adalah...",
    correct:
      "Melambangkan anggota Pramuka yang berguna dan mampu menyesuaikan diri",
    distractors: [
      "Melambangkan kegiatan tanpa tujuan",
      "Melambangkan organisasi perdagangan",
      "Melambangkan sikap malas",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa kelapa dipilih sebagai lambang Gerakan Pramuka?",
    correct: "Karena hampir seluruh bagian kelapa bermanfaat bagi kehidupan",
    distractors: [
      "Karena kelapa tidak memiliki manfaat",
      "Karena kelapa hanya hidup di dalam ruangan",
      "Karena kelapa melambangkan persaingan tidak sehat",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Warna dasar seragam Pramuka Indonesia umumnya adalah...",
    correct: "Cokelat muda dan cokelat tua",
    distractors: [
      "Merah muda dan biru",
      "Hijau neon dan ungu",
      "Hitam dan emas",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Salam Pramuka digunakan untuk...",
    correct: "Memberi penghormatan dan menunjukkan persaudaraan",
    distractors: [
      "Mengejek anggota lain",
      "Mengakhiri semua latihan",
      "Mengganti kode kehormatan",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Apa manfaat upacara dalam kegiatan Pramuka?",
    correct: "Melatih disiplin, penghormatan, dan rasa kebangsaan",
    distractors: [
      "Menghapus nilai tanggung jawab",
      "Membuat peserta tidak tertib",
      "Menghilangkan semangat persatuan",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa arti disiplin dalam kegiatan Pramuka?",
    correct: "Ketaatan terhadap aturan dan kesediaan bertanggung jawab",
    distractors: [
      "Kebebasan melanggar aturan",
      "Sikap menunda semua tugas",
      "Menolak arahan pembina",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa tanda pengenal penting dalam Gerakan Pramuka?",
    correct: "Menunjukkan identitas, kecakapan, dan kedudukan anggota",
    distractors: [
      "Menghapus struktur organisasi",
      "Menjadi pengganti semua latihan",
      "Membuat anggota tidak perlu berprestasi",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi tanda kecakapan dalam Pramuka?",
    correct: "Menunjukkan kemampuan atau keterampilan yang telah dicapai",
    distractors: [
      "Menentukan harga seragam",
      "Menghapus kegiatan praktik",
      "Mengganti peran pembina",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa identitas Pramuka perlu dijaga dengan baik?",
    correct: "Agar anggota menunjukkan sikap hormat terhadap organisasi",
    distractors: [
      "Agar anggota bebas merusak lambang",
      "Agar kode kehormatan tidak digunakan",
      "Agar kegiatan menjadi tidak tertib",
    ],
    weightPriority: "HIGH",
  },

  // 41-50: Penerapan nilai
  {
    text: "Jika anggota regu berbeda pendapat saat menentukan rute jelajah, sikap yang sesuai nilai Pramuka adalah...",
    correct: "Bermusyawarah untuk mencapai keputusan bersama",
    distractors: [
      "Memaksakan pendapat sendiri",
      "Meninggalkan regu",
      "Membatalkan semua kegiatan tanpa alasan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jika melihat sampah berserakan di area perkemahan, tindakan yang tepat adalah...",
    correct: "Membersihkan dan mengajak teman menjaga lingkungan",
    distractors: [
      "Membiarkan karena bukan tugas pribadi",
      "Menambah sampah agar cepat penuh",
      "Menyembunyikan sampah di tenda teman",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Jika seorang teman kesulitan memasang tenda, sikap sesuai Dasa Darma adalah...",
    correct: "Membantu dengan sabar dan bekerja sama",
    distractors: [
      "Menertawakan tanpa membantu",
      "Meninggalkan teman sendirian",
      "Menyuruh teman berhenti berlatih",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa kegiatan regu dapat melatih kepemimpinan?",
    correct:
      "Karena anggota belajar membagi tugas, mengambil keputusan, dan bertanggung jawab",
    distractors: [
      "Karena semua anggota dilarang berbicara",
      "Karena tidak ada pembagian tugas",
      "Karena regu hanya berisi satu orang",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Dalam kegiatan alam terbuka, mengapa keselamatan harus diutamakan?",
    correct: "Agar kegiatan berjalan aman dan peserta terhindar dari risiko",
    distractors: [
      "Agar peserta bebas mengambil risiko tanpa aturan",
      "Agar kegiatan tidak perlu direncanakan",
      "Agar pembina tidak perlu mengawasi",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa contoh penerapan nilai hemat dalam kegiatan Pramuka?",
    correct: "Menggunakan perlengkapan seperlunya dan tidak boros",
    distractors: [
      "Membuang makanan yang masih layak",
      "Membeli semua perlengkapan tanpa kebutuhan",
      "Menggunakan air tanpa batas",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa contoh penerapan nilai suci dalam pikiran, perkataan, dan perbuatan?",
    correct: "Berpikir baik, berkata jujur, dan bertindak benar",
    distractors: [
      "Berbohong demi menang lomba",
      "Menghina anggota regu lain",
      "Mengabaikan tanggung jawab",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa Pramuka menekankan kegiatan yang menarik dan menantang?",
    correct: "Agar peserta belajar aktif melalui pengalaman yang bermakna",
    distractors: [
      "Agar peserta tidak memperoleh keterampilan",
      "Agar pembelajaran hanya berupa hafalan",
      "Agar kegiatan tidak memiliki tujuan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Apa sikap yang tepat ketika regu kalah dalam perlombaan?",
    correct: "Menerima hasil dengan sportif dan memperbaiki kekurangan",
    distractors: [
      "Menyalahkan semua orang",
      "Menolak mengikuti latihan lagi",
      "Merusak perlengkapan lomba",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa makna Pramuka sebagai pendidikan karakter bagi generasi muda?",
    correct:
      "Membantu peserta menjadi mandiri, bertanggung jawab, dan berguna bagi masyarakat",
    distractors: [
      "Membuat peserta hanya mengejar hadiah",
      "Menghapus nilai kerja sama",
      "Mengganti semua pendidikan keluarga",
    ],
    weightPriority: "VERY_HIGH",
  },
];

const seedTargets: SeedTarget[] = [
  {
    ownerEmail: "admin@test.com",
    subjectName: "Biologi",
    prefix: BIOLOGY_PREFIX,
    tryoutTitle: BIOLOGY_TRYOUT_TITLE,
    sources: biologySources,
    totalQuestions: 40,
    durationMinutes: 60,
    maxAttempts: null,
    status: "OPEN",
  },
  {
    ownerEmail: "teacher@test.com",
    subjectName: "Bahasa Indonesia Kelas 10",
    prefix: BINDO_PREFIX,
    tryoutTitle: BINDO_TRYOUT_TITLE,
    sources: bahasaIndonesiaSources,
    totalQuestions: 25,
    durationMinutes: 45,
    maxAttempts: 3,
    status: "OPEN",
  },
  {
    ownerEmail: "teacher@test.com",
    subjectName: "Pramuka Boyman Bab 1-2",
    prefix: PRAMUKA_PREFIX,
    tryoutTitle: PRAMUKA_TRYOUT_TITLE,
    sources: pramukaSources,
    totalQuestions: 25,
    durationMinutes: 45,
    maxAttempts: 3,
    status: "OPEN",
  },
];

function assertQuestionCount(
  label: string,
  sources: QuestionSource[],
  count: number,
) {
  if (sources.length !== count) {
    throw new Error(`${label} harus ${count} soal, sekarang ${sources.length}`);
  }
}

function buildQuestions(prefix: string, sources: QuestionSource[]) {
  return sources.map((source, index): RawQuestion => {
    const correctIndex = index % 4;
    const choices = [...source.distractors];
    choices.splice(correctIndex, 0, source.correct);

    const [optionA, optionB, optionC, optionD] = choices as [
      string,
      string,
      string,
      string,
    ];

    return {
      questionText: `${prefix} ${String(index + 1).padStart(3, "0")}. ${source.text}`,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer: answerOptions[correctIndex] as AnswerOption,
      weightPriority: source.weightPriority,
    };
  });
}

async function getOwnerByEmail(email: string) {
  const owner = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!owner) {
    throw new Error(`Owner not found: ${email}. Run seed.ts first.`);
  }

  return owner;
}

async function findOrCreateOwnedSubject(name: string, ownerId: string) {
  const existingSubject = await prisma.subject.findFirst({
    where: {
      name,
      ownerId,
    },
  });

  if (existingSubject) {
    return existingSubject;
  }

  return prisma.subject.create({
    data: {
      name,
      ownerId,
    },
  });
}

async function cleanupSeedData() {
  await prisma.tryout.deleteMany({
    where: {
      title: {
        in: [BIOLOGY_TRYOUT_TITLE, BINDO_TRYOUT_TITLE, PRAMUKA_TRYOUT_TITLE],
      },
    },
  });

  await prisma.question.deleteMany({
    where: {
      OR: [
        {
          questionText: {
            startsWith: LEGACY_BIOLOGY_PREFIX,
          },
        },
        {
          questionText: {
            startsWith: BIOLOGY_PREFIX,
          },
        },
        {
          questionText: {
            startsWith: BINDO_PREFIX,
          },
        },
        {
          questionText: {
            startsWith: PRAMUKA_PREFIX,
          },
        },
      ],
    },
  });
}

async function seedQuestionsForTarget(target: SeedTarget) {
  const owner = await getOwnerByEmail(target.ownerEmail);
  const subject = await findOrCreateOwnedSubject(target.subjectName, owner.id);
  const questions = buildQuestions(target.prefix, target.sources);

  for (const rawQuestion of questions) {
    const difficulty = classifyQuestionDifficulty({
      questionText: rawQuestion.questionText,
      imageAltText: null,
      hasImage: false,
    });

    const weight = getWeightFromPriority(rawQuestion.weightPriority);

    await prisma.question.create({
      data: {
        subjectId: subject.id,
        ownerId: owner.id,
        questionText: rawQuestion.questionText,
        optionA: rawQuestion.optionA,
        optionB: rawQuestion.optionB,
        optionC: rawQuestion.optionC,
        optionD: rawQuestion.optionD,
        correctAnswer: rawQuestion.correctAnswer,
        imageUrl: null,
        imagePath: null,
        imageAltText: null,
        difficultyLevel: difficulty.difficultyLevel,
        difficultyScore: difficulty.difficultyScore,
        detectedIndicators:
          difficulty.detectedIndicators as Prisma.InputJsonValue,
        weightPriority: rawQuestion.weightPriority,
        weight,
      },
    });
  }

  const tryout = await prisma.tryout.create({
    data: {
      subjectId: subject.id,
      ownerId: owner.id,
      title: target.tryoutTitle,
      totalQuestions: target.totalQuestions,
      durationMinutes: target.durationMinutes,
      maxAttempts: target.maxAttempts,
      status: target.status,
    },
  });

  const answerDistribution = await prisma.question.groupBy({
    by: ["correctAnswer"],
    where: {
      questionText: {
        startsWith: target.prefix,
      },
    },
    _count: {
      correctAnswer: true,
    },
  });

  const difficultyDistribution = await prisma.question.groupBy({
    by: ["difficultyLevel"],
    where: {
      questionText: {
        startsWith: target.prefix,
      },
    },
    _count: {
      difficultyLevel: true,
    },
  });

  console.log(`Seeded ${questions.length} questions: ${target.subjectName}`);
  console.log(`Created tryout: ${tryout.title}`);
  console.log("Answer distribution:", answerDistribution);
  console.log("Difficulty distribution:", difficultyDistribution);
}

async function main() {
  assertQuestionCount("Biologi", biologySources, 120);
  assertQuestionCount("Bahasa Indonesia Kelas 10", bahasaIndonesiaSources, 50);
  assertQuestionCount("Pramuka Boyman Bab 1-2", pramukaSources, 50);

  await cleanupSeedData();

  for (const target of seedTargets) {
    await seedQuestionsForTarget(target);
  }

  console.log("Seed questions completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
