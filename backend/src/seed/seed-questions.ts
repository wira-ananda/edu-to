import "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import {
  classifyQuestionDifficulty,
  getWeightFromPriority,
} from "../lib/question-difficulty.js";
import type { AnswerOption, WeightPriority } from "../generated/prisma/client.js";

const TEST_PREFIX = "[TEST-BIO-SMA]";

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

const answerOptions: AnswerOption[] = ["A", "B", "C", "D"];

const questionSources: QuestionSource[] = [
  {
    text: "Apa fungsi utama klorofil pada proses fotosintesis?",
    correct: "Menyerap energi cahaya matahari",
    distractors: [
      "Mengangkut air dari akar ke daun",
      "Menyimpan cadangan makanan pada batang",
      "Menghasilkan karbon dioksida",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Sebutkan organel sel yang berfungsi sebagai tempat respirasi sel.",
    correct: "Mitokondria",
    distractors: ["Ribosom", "Vakuola", "Kloroplas"],
    weightPriority: "LOW",
  },
  {
    text: "Apa pengertian ekosistem dalam biologi?",
    correct: "Interaksi antara makhluk hidup dan lingkungannya",
    distractors: [
      "Kumpulan jaringan yang membentuk organ",
      "Proses pembentukan energi dalam sel",
      "Pewarisan sifat dari induk ke keturunan",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Sebutkan jaringan tumbuhan yang berfungsi mengangkut air dari akar ke daun.",
    correct: "Xilem",
    distractors: ["Floem", "Epidermis", "Parenkim"],
    weightPriority: "LOW",
  },
  {
    text: "Apa fungsi enzim amilase pada sistem pencernaan manusia?",
    correct: "Memecah karbohidrat menjadi gula sederhana",
    distractors: [
      "Memecah protein menjadi asam amino",
      "Mengemulsikan lemak di usus halus",
      "Menyerap air di usus besar",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa fungsi stomata pada daun?",
    correct: "Mengatur pertukaran gas dan penguapan air",
    distractors: [
      "Menyerap mineral dari tanah",
      "Menghasilkan sel kelamin jantan",
      "Mengangkut hasil fotosintesis",
    ],
    weightPriority: "NORMAL",
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
    text: "Apa pengertian homeostasis?",
    correct: "Kemampuan tubuh mempertahankan kondisi internal yang stabil",
    distractors: [
      "Proses pembentukan sel kelamin",
      "Perpindahan air melalui membran",
      "Perubahan bentuk tubuh karena pertumbuhan",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Sebutkan bagian ginjal yang berperan dalam pembentukan urine.",
    correct: "Nefron",
    distractors: ["Alveolus", "Vili", "Bronkiolus"],
    weightPriority: "LOW",
  },
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
    text: "Sebutkan jaringan tumbuhan yang mengangkut hasil fotosintesis.",
    correct: "Floem",
    distractors: ["Xilem", "Epidermis", "Kolenkim"],
    weightPriority: "LOW",
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
    text: "Sebutkan bagian utama sistem saraf pusat.",
    correct: "Otak dan sumsum tulang belakang",
    distractors: [
      "Jantung dan pembuluh darah",
      "Paru-paru dan alveolus",
      "Lambung dan usus halus",
    ],
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
  {
    text: "Apa zat utama yang dihasilkan tumbuhan dalam fotosintesis?",
    correct: "Glukosa",
    distractors: ["Urea", "Asam laktat", "Hemoglobin"],
    weightPriority: "NORMAL",
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
    text: "Apa pengertian osmosis?",
    correct: "Perpindahan air melalui membran semipermeabel",
    distractors: [
      "Perpindahan oksigen melalui darah",
      "Pecahnya molekul protein",
      "Pembentukan glukosa di kloroplas",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Apa pengertian difusi?",
    correct: "Perpindahan zat dari konsentrasi tinggi ke konsentrasi rendah",
    distractors: [
      "Perpindahan air dari akar ke daun saja",
      "Pembentukan protein di ribosom",
      "Pewarisan sifat melalui kromosom",
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
    text: "Apa pengertian seleksi alam?",
    correct:
      "Proses bertahannya individu yang memiliki sifat paling sesuai dengan lingkungan",
    distractors: [
      "Perpindahan air melalui membran sel",
      "Pembentukan protein oleh ribosom",
      "Pengangkutan oksigen oleh hemoglobin",
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
    text: "Jelaskan hubungan antara intensitas cahaya dan laju fotosintesis pada tumbuhan.",
    correct: "Laju fotosintesis meningkat hingga mencapai batas tertentu",
    distractors: [
      "Fotosintesis berhenti saat ada cahaya",
      "Cahaya hanya dibutuhkan oleh akar",
      "Intensitas cahaya tidak pernah berpengaruh",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa sel darah merah manusia tidak memiliki inti sel ketika sudah matang?",
    correct: "Agar ruang untuk hemoglobin lebih besar",
    distractors: [
      "Agar dapat membelah lebih cepat",
      "Agar dapat menghasilkan antibodi",
      "Agar dapat mencerna bakteri",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Bandingkan perbedaan utama antara mitosis dan meiosis berdasarkan jumlah sel anak.",
    correct:
      "Mitosis menghasilkan dua sel anak, meiosis menghasilkan empat sel anak",
    distractors: [
      "Mitosis menghasilkan empat sel anak, meiosis menghasilkan dua sel anak",
      "Keduanya menghasilkan satu sel anak",
      "Keduanya tidak menghasilkan sel anak",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Jelaskan proses pertukaran gas oksigen dan karbon dioksida di alveolus.",
    correct: "Gas berpindah secara difusi karena perbedaan konsentrasi",
    distractors: [
      "Gas berpindah karena dipompa oleh jantung",
      "Gas berpindah melalui enzim pencernaan",
      "Gas berpindah melalui filtrasi ginjal",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa penggunaan antibiotik yang tidak sesuai aturan dapat menyebabkan resistensi bakteri?",
    correct: "Bakteri yang tahan dapat bertahan hidup dan berkembang biak",
    distractors: [
      "Antibiotik mengubah bakteri menjadi virus",
      "Antibiotik membuat bakteri memiliki klorofil",
      "Bakteri berhenti melakukan metabolisme selamanya",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Bedakan peran DNA dan RNA dalam proses sintesis protein.",
    correct:
      "DNA menyimpan informasi genetik, RNA membantu membawa dan menerjemahkan informasi tersebut",
    distractors: [
      "DNA membentuk membran sel, RNA membentuk dinding sel",
      "DNA hanya ada di ribosom, RNA hanya ada di mitokondria",
      "DNA dan RNA tidak berperan dalam sintesis protein",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Jelaskan hubungan antara produsen, konsumen, dan dekomposer dalam aliran energi ekosistem.",
    correct:
      "Produsen membentuk bahan organik, konsumen memanfaatkannya, dekomposer menguraikan sisa organisme",
    distractors: [
      "Produsen hanya memakan konsumen tingkat satu",
      "Dekomposer menghasilkan cahaya untuk fotosintesis",
      "Konsumen mengubah energi matahari langsung menjadi glukosa",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jelaskan pengaruh suhu terhadap kerja enzim dalam reaksi metabolisme.",
    correct:
      "Enzim bekerja optimal pada suhu tertentu dan dapat rusak pada suhu terlalu tinggi",
    distractors: [
      "Enzim selalu bekerja lebih cepat pada semua suhu",
      "Enzim hanya bekerja saat suhu nol derajat",
      "Suhu tidak memengaruhi bentuk enzim",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa kelembapan udara dapat memengaruhi laju transpirasi pada tumbuhan?",
    correct: "Kelembapan tinggi menurunkan penguapan air dari daun",
    distractors: [
      "Kelembapan tinggi selalu meningkatkan transpirasi tanpa batas",
      "Kelembapan hanya memengaruhi warna bunga",
      "Kelembapan mengubah xilem menjadi floem",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Jelaskan hubungan antara osmosis dan plasmolisis pada sel tumbuhan.",
    correct:
      "Plasmolisis terjadi saat air keluar dari sel karena lingkungan hipertonik",
    distractors: [
      "Plasmolisis terjadi saat sel membelah menjadi dua",
      "Osmosis hanya terjadi pada sel hewan",
      "Plasmolisis membuat kloroplas menjadi mitokondria",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Bandingkan imunitas humoral dan imunitas seluler pada sistem kekebalan tubuh.",
    correct:
      "Imunitas humoral melibatkan antibodi, sedangkan imunitas seluler melibatkan sel T",
    distractors: [
      "Keduanya hanya melibatkan eritrosit",
      "Imunitas humoral terjadi di ginjal",
      "Imunitas seluler hanya terjadi pada tumbuhan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jelaskan proses reabsorpsi pada nefron ginjal.",
    correct: "Zat yang masih dibutuhkan tubuh diserap kembali ke darah",
    distractors: [
      "Darah dipompa dari jantung ke paru-paru",
      "Oksigen ditukar dengan karbon dioksida",
      "Protein disintesis oleh ribosom",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Jelaskan hubungan antara sinapsis dan penghantaran impuls saraf.",
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
    text: "Mengapa mekanisme umpan balik negatif penting dalam sistem hormon?",
    correct: "Umpan balik negatif menjaga kadar hormon tetap stabil",
    distractors: [
      "Umpan balik negatif selalu menghentikan metabolisme",
      "Umpan balik negatif hanya terjadi pada tumbuhan",
      "Umpan balik negatif mengubah hormon menjadi antibodi",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Bedakan genotipe dan fenotipe dalam pewarisan sifat.",
    correct: "Genotipe adalah susunan gen, fenotipe adalah sifat yang tampak",
    distractors: [
      "Genotipe adalah organ, fenotipe adalah jaringan",
      "Genotipe hanya dimiliki bakteri",
      "Fenotipe tidak dipengaruhi gen",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Jelaskan hubungan antara tumbuhan dan siklus karbon.",
    correct: "Tumbuhan menyerap karbon dioksida saat fotosintesis",
    distractors: [
      "Tumbuhan menghasilkan semua karbon dioksida di atmosfer",
      "Tumbuhan tidak berperan dalam siklus karbon",
      "Tumbuhan mengubah karbon menjadi nitrogen secara langsung",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Mengapa energi dalam rantai makanan semakin berkurang pada tingkat trofik berikutnya?",
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
    text: "Jelaskan hubungan antara mutasi gen dan perubahan protein.",
    correct:
      "Mutasi dapat mengubah urutan basa sehingga memengaruhi susunan asam amino",
    distractors: [
      "Mutasi selalu mengubah air menjadi glukosa",
      "Mutasi hanya terjadi pada jaringan xilem",
      "Mutasi tidak pernah memengaruhi protein",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jelaskan proses penyerbukan dan kaitannya dengan pembentukan biji.",
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
    text: "Mengapa frekuensi napas meningkat saat seseorang berolahraga?",
    correct: "Kebutuhan oksigen dan pembuangan karbon dioksida meningkat",
    distractors: [
      "Kadar oksigen tubuh selalu turun menjadi nol",
      "Otot berhenti membutuhkan energi",
      "Ginjal menghentikan pembentukan urine",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Jelaskan hubungan hormon estrogen dan progesteron dalam siklus menstruasi.",
    correct:
      "Keduanya membantu mengatur perubahan dinding rahim dan siklus reproduksi",
    distractors: [
      "Keduanya mengangkut oksigen dalam darah",
      "Keduanya memecah karbohidrat di mulut",
      "Keduanya menyaring darah di glomerulus",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa golongan darah anak dapat berbeda dari orang tuanya?",
    correct: "Anak menerima kombinasi alel dari ayah dan ibu",
    distractors: [
      "Darah anak dibentuk oleh klorofil",
      "Golongan darah tidak dipengaruhi gen",
      "Golongan darah hanya ditentukan makanan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Bandingkan transpor aktif dan transpor pasif pada membran sel.",
    correct:
      "Transpor aktif membutuhkan energi, transpor pasif tidak membutuhkan energi",
    distractors: [
      "Transpor aktif hanya terjadi pada benda mati",
      "Transpor pasif selalu melawan gradien konsentrasi",
      "Keduanya selalu membutuhkan ATP",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Jelaskan hubungan antara hormon auksin dan gerak fototropisme pada tumbuhan.",
    correct: "Distribusi auksin memengaruhi pertumbuhan batang ke arah cahaya",
    distractors: [
      "Auksin memecah protein menjadi asam amino",
      "Auksin menyaring darah di ginjal",
      "Auksin membentuk antibodi",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jelaskan peran bakteri dalam proses fermentasi makanan.",
    correct:
      "Bakteri tertentu mengubah bahan organik menjadi produk fermentasi",
    distractors: [
      "Bakteri selalu merusak semua makanan",
      "Bakteri menghasilkan cahaya untuk fotosintesis",
      "Bakteri membentuk jaringan epitel",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Jelaskan proses replikasi virus secara umum di dalam sel inang.",
    correct:
      "Virus memasukkan materi genetik lalu memanfaatkan sel inang untuk membentuk partikel baru",
    distractors: [
      "Virus membelah diri seperti sel manusia",
      "Virus membuat makanan melalui klorofil",
      "Virus menyaring urine di nefron",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa daya dukung lingkungan membatasi pertumbuhan populasi?",
    correct:
      "Sumber daya seperti makanan, ruang, dan air tersedia dalam jumlah terbatas",
    distractors: [
      "Populasi tidak membutuhkan sumber daya",
      "Daya dukung selalu membuat populasi tidak berubah",
      "Lingkungan tidak memengaruhi organisme",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jelaskan hubungan antara adaptasi dan seleksi alam.",
    correct:
      "Individu dengan adaptasi yang sesuai memiliki peluang hidup dan bereproduksi lebih besar",
    distractors: [
      "Adaptasi menghentikan proses reproduksi",
      "Seleksi alam hanya terjadi pada batuan",
      "Adaptasi tidak berhubungan dengan lingkungan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa pola makan tidak seimbang dapat memengaruhi metabolisme tubuh?",
    correct: "Asupan zat gizi memengaruhi energi, hormon, dan kerja organ",
    distractors: [
      "Makanan tidak berpengaruh pada sel tubuh",
      "Metabolisme hanya terjadi pada tumbuhan",
      "Zat gizi selalu menghambat kerja enzim",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Bandingkan ciri tumbuhan monokotil dan dikotil berdasarkan jumlah keping bijinya.",
    correct:
      "Monokotil memiliki satu keping biji, dikotil memiliki dua keping biji",
    distractors: [
      "Monokotil memiliki dua keping biji, dikotil satu keping biji",
      "Keduanya tidak memiliki biji",
      "Keduanya selalu berkembang biak dengan spora",
    ],
    weightPriority: "LOW",
  },
  {
    text: "Mengapa enzim bersifat spesifik terhadap substrat tertentu?",
    correct: "Bentuk sisi aktif enzim sesuai dengan substrat tertentu",
    distractors: [
      "Enzim selalu bekerja pada semua substrat",
      "Enzim tidak memiliki bentuk tertentu",
      "Enzim hanya bekerja sebagai pengangkut oksigen",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Jelaskan hubungan antara beberapa sistem organ dalam menjaga homeostasis tubuh.",
    correct:
      "Sistem organ bekerja sama untuk menjaga kondisi internal tetap stabil",
    distractors: [
      "Sistem organ bekerja sendiri tanpa hubungan",
      "Homeostasis hanya terjadi pada virus",
      "Sistem organ selalu menghentikan metabolisme",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Mengapa pencemaran air dapat menurunkan kadar oksigen terlarut?",
    correct:
      "Penguraian bahan pencemar dapat meningkatkan penggunaan oksigen oleh mikroorganisme",
    distractors: [
      "Pencemaran selalu menambah oksigen tanpa batas",
      "Oksigen terlarut tidak dibutuhkan organisme air",
      "Mikroorganisme tidak menggunakan oksigen",
    ],
    weightPriority: "HIGH",
  },

  {
    text: "Perhatikan wacana berikut. Seorang siswa menanam dua tanaman kacang hijau. Tanaman pertama diletakkan di tempat terang, sedangkan tanaman kedua diletakkan di ruang gelap. Setelah beberapa hari, tanaman di ruang gelap tumbuh lebih tinggi, tetapi batangnya pucat dan lemah. Analisislah penyebab perbedaan pertumbuhan tersebut.",
    correct:
      "Tanaman di ruang gelap mengalami etiolasi karena kekurangan cahaya",
    distractors: [
      "Tanaman di ruang terang tidak melakukan respirasi",
      "Tanaman di ruang gelap memiliki klorofil lebih banyak",
      "Tanaman di ruang terang kekurangan oksigen",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Berdasarkan tabel hasil percobaan, kelompok tanaman yang diberi pupuk nitrogen menunjukkan pertumbuhan daun lebih cepat dibanding kelompok tanpa pupuk. Simpulkan peran nitrogen terhadap pertumbuhan tanaman.",
    correct: "Nitrogen mendukung pembentukan protein dan pertumbuhan vegetatif",
    distractors: [
      "Nitrogen menghambat pembentukan jaringan meristem",
      "Nitrogen hanya berfungsi sebagai sumber cahaya",
      "Nitrogen menyebabkan tanaman berhenti berfotosintesis",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Studi kasus menunjukkan populasi ikan di sungai menurun setelah limbah deterjen meningkat. Analisislah hubungan antara pencemaran air dan penurunan populasi ikan tersebut.",
    correct: "Limbah dapat menurunkan kualitas air dan kadar oksigen terlarut",
    distractors: [
      "Limbah deterjen selalu meningkatkan jumlah makanan ikan",
      "Ikan tidak dipengaruhi oleh perubahan kualitas air",
      "Deterjen mempercepat proses fotosintesis ikan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Evaluasilah dampak kerusakan membran sel terhadap kemampuan sel dalam menjaga keseimbangan zat di dalam dan luar sel.",
    correct:
      "Sel kehilangan kemampuan mengatur keluar masuknya zat secara selektif",
    distractors: [
      "Sel menjadi lebih mampu menghasilkan klorofil",
      "Sel langsung berubah menjadi jaringan",
      "Sel tidak mengalami perubahan fungsi",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Perhatikan gambar struktur nefron pada ginjal. Analisislah bagian yang berperan dalam proses filtrasi darah dan jelaskan akibatnya jika bagian tersebut mengalami kerusakan.",
    correct:
      "Glomerulus, karena berfungsi menyaring darah pada tahap awal pembentukan urine",
    distractors: [
      "Ureter, karena berfungsi menyaring protein darah",
      "Kandung kemih, karena berfungsi membentuk urine primer",
      "Uretra, karena berfungsi menyerap glukosa dari darah",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Berdasarkan grafik pertumbuhan populasi bakteri, jumlah bakteri meningkat sangat cepat setelah fase adaptasi. Prediksi penyebab peningkatan tersebut jika nutrisi dan suhu lingkungan berada pada kondisi optimal.",
    correct: "Bakteri memasuki fase eksponensial dengan laju pembelahan tinggi",
    distractors: [
      "Bakteri berhenti melakukan reproduksi",
      "Bakteri mengalami kematian massal",
      "Bakteri berubah menjadi sel tumbuhan",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Analisislah dampak penggunaan pestisida berlebihan terhadap keseimbangan rantai makanan di ekosistem sawah berdasarkan kasus kematian serangga non-target dan berkurangnya populasi burung pemakan serangga.",
    correct:
      "Pestisida dapat membunuh organisme non-target dan mengganggu keseimbangan populasi",
    distractors: [
      "Pestisida hanya membunuh tanaman padi",
      "Pestisida meningkatkan jumlah semua predator secara langsung",
      "Pestisida tidak memengaruhi organisme lain",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Studi kasus kultur jaringan menunjukkan banyak bibit anggrek dapat diperoleh dari sebagian kecil jaringan tanaman induk dalam kondisi steril. Simpulkan alasan teknik tersebut efektif untuk perbanyakan tanaman unggul.",
    correct:
      "Kultur jaringan memanfaatkan kemampuan sel tanaman membentuk individu baru yang seragam",
    distractors: [
      "Kultur jaringan hanya dapat dilakukan pada hewan vertebrata",
      "Kultur jaringan menghentikan pembelahan sel tanaman",
      "Kultur jaringan tidak membutuhkan kondisi steril",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Perhatikan wacana berikut. Peningkatan suhu laut menyebabkan sebagian karang kehilangan alga simbiotiknya sehingga warna karang memutih. Analisislah hubungan antara perubahan suhu dan kelangsungan hidup terumbu karang.",
    correct:
      "Suhu tinggi dapat mengganggu simbiosis karang dan alga sehingga karang kekurangan sumber energi",
    distractors: [
      "Suhu tinggi selalu meningkatkan pertumbuhan karang",
      "Karang tidak membutuhkan organisme simbion",
      "Pemutihan karang terjadi karena karang menghasilkan hemoglobin",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Studi kasus di rumah sakit menunjukkan beberapa bakteri tidak lagi mati setelah diberi antibiotik yang sama secara berulang. Evaluasilah penyebab utama munculnya bakteri resisten tersebut.",
    correct:
      "Seleksi terhadap bakteri tahan antibiotik membuat bakteri tersebut bertahan dan berkembang biak",
    distractors: [
      "Antibiotik mengubah semua bakteri menjadi virus",
      "Bakteri resisten muncul karena tidak memiliki DNA",
      "Antibiotik selalu meningkatkan jumlah bakteri baik",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Perhatikan kasus seseorang dengan kadar glukosa darah tinggi dalam waktu lama. Analisislah hubungan gangguan hormon insulin dengan kondisi tersebut.",
    correct:
      "Gangguan insulin menyebabkan glukosa darah sulit masuk ke sel sehingga kadarnya tetap tinggi",
    distractors: [
      "Insulin berfungsi mengangkut oksigen di eritrosit",
      "Glukosa darah tinggi selalu disebabkan oleh stomata",
      "Insulin diproduksi oleh alveolus",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Berdasarkan tabel kualitas air, kadar nitrat meningkat dan pertumbuhan alga di danau menjadi sangat tinggi. Simpulkan dampak kondisi tersebut terhadap organisme air.",
    correct:
      "Ledakan alga dapat menurunkan oksigen terlarut dan mengganggu kehidupan organisme air",
    distractors: [
      "Nitrat selalu menurunkan jumlah alga",
      "Ledakan alga tidak memengaruhi kadar oksigen",
      "Organisme air tidak membutuhkan oksigen terlarut",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Berdasarkan grafik kerja enzim, aktivitas enzim menurun tajam setelah suhu melewati titik optimum. Analisislah penyebab penurunan aktivitas tersebut.",
    correct:
      "Struktur enzim berubah sehingga sisi aktif tidak sesuai dengan substrat",
    distractors: [
      "Enzim berubah menjadi antibodi",
      "Substrat berubah menjadi membran sel",
      "Enzim selalu bekerja maksimal pada suhu sangat tinggi",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Perhatikan silsilah keluarga yang menunjukkan penyakit genetik muncul pada beberapa generasi. Analisislah kemungkinan pola pewarisan sifat tersebut berdasarkan kemunculan sifat pada keturunan.",
    correct:
      "Pola kemunculan sifat dapat digunakan untuk memperkirakan alel dominan atau resesif",
    distractors: [
      "Silsilah keluarga tidak berkaitan dengan pewarisan sifat",
      "Penyakit genetik hanya disebabkan oleh makanan",
      "Setiap keturunan pasti memiliki fenotipe yang sama",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Studi kasus menunjukkan spesies asing masuk ke suatu danau dan berkembang pesat karena tidak memiliki predator alami. Evaluasilah dampaknya terhadap keanekaragaman hayati lokal.",
    correct:
      "Spesies asing dapat menekan populasi lokal dan mengganggu keseimbangan ekosistem",
    distractors: [
      "Spesies asing selalu meningkatkan semua populasi lokal",
      "Predator alami tidak memengaruhi populasi",
      "Keanekaragaman hayati tidak dipengaruhi kompetisi",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Analisislah hubungan antara deforestasi dan terganggunya siklus air berdasarkan kasus berkurangnya tutupan hutan di daerah resapan air.",
    correct:
      "Deforestasi mengurangi penyerapan air tanah dan dapat meningkatkan risiko banjir",
    distractors: [
      "Deforestasi meningkatkan akar penyerap air",
      "Hutan tidak berperan dalam siklus air",
      "Deforestasi selalu menurunkan aliran permukaan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Studi kasus vaksinasi menunjukkan jumlah kasus penyakit menurun ketika sebagian besar populasi sudah memiliki kekebalan. Simpulkan hubungan vaksinasi dengan kekebalan kelompok.",
    correct:
      "Kekebalan kelompok mengurangi peluang penularan penyakit dalam populasi",
    distractors: [
      "Vaksin membuat semua orang langsung kebal seumur hidup terhadap semua penyakit",
      "Vaksin bekerja dengan menghilangkan eritrosit",
      "Kekebalan kelompok hanya terjadi pada tumbuhan",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Berdasarkan kasus mutasi pada urutan DNA, suatu protein menjadi tidak berfungsi normal. Analisislah hubungan perubahan basa nitrogen dengan struktur protein.",
    correct:
      "Perubahan basa dapat mengubah kodon sehingga susunan asam amino ikut berubah",
    distractors: [
      "Perubahan basa tidak pernah memengaruhi protein",
      "Protein dibentuk oleh xilem",
      "Kodon berfungsi menyaring darah",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Perhatikan kasus pasien gagal ginjal yang mengalami penumpukan zat sisa metabolisme dalam darah. Evaluasilah penyebab kondisi tersebut berdasarkan fungsi ginjal.",
    correct: "Ginjal gagal menyaring darah dan membuang zat sisa melalui urine",
    distractors: [
      "Ginjal gagal menghasilkan cahaya untuk fotosintesis",
      "Ginjal mengubah oksigen menjadi karbon dioksida",
      "Ginjal berhenti membentuk hemoglobin",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Berdasarkan data pendaki gunung di dataran tinggi, kadar oksigen rendah menyebabkan tubuh meningkatkan produksi sel darah merah. Analisislah manfaat respons tersebut.",
    correct:
      "Peningkatan sel darah merah membantu meningkatkan kapasitas pengangkutan oksigen",
    distractors: [
      "Sel darah merah berfungsi menghasilkan empedu",
      "Oksigen rendah membuat tubuh tidak membutuhkan hemoglobin",
      "Produksi sel darah merah menurunkan kemampuan membawa oksigen",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Berdasarkan percobaan transpirasi, tanaman pada kondisi berangin kehilangan air lebih cepat daripada tanaman pada kondisi tenang. Simpulkan faktor yang memengaruhi hasil tersebut.",
    correct: "Angin mempercepat penguapan air dari permukaan daun",
    distractors: [
      "Angin menghentikan kerja stomata secara permanen",
      "Angin mengubah xilem menjadi floem",
      "Angin membuat akar tidak menyerap air sama sekali",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Studi kasus konservasi menunjukkan dua spesies terancam punah membutuhkan habitat hutan yang sama. Evaluasilah strategi konservasi yang paling tepat untuk menjaga keberlanjutan kedua spesies.",
    correct:
      "Melindungi habitat utama dan mengurangi gangguan manusia pada kawasan tersebut",
    distractors: [
      "Menghilangkan seluruh vegetasi hutan",
      "Memindahkan semua predator tanpa kajian",
      "Mengabaikan ketersediaan makanan dan tempat hidup",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Perhatikan wacana pemulihan ekosistem setelah kebakaran hutan. Beberapa jenis rumput tumbuh lebih dahulu sebelum semak dan pohon kembali muncul. Analisislah proses suksesi yang terjadi.",
    correct:
      "Terjadi suksesi sekunder karena tanah masih tersedia setelah gangguan",
    distractors: [
      "Terjadi suksesi primer karena tidak ada tanah sama sekali",
      "Terjadi fermentasi karena cahaya meningkat",
      "Terjadi osmosis karena populasi hewan bertambah",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Berdasarkan kasus infeksi, sel darah putih tertentu menghancurkan sel tubuh yang telah terinfeksi virus. Analisislah jenis respons imun yang paling berperan.",
    correct: "Imunitas seluler karena melibatkan kerja sel T sitotoksik",
    distractors: [
      "Transpirasi karena melibatkan stomata",
      "Filtrasi karena terjadi di glomerulus",
      "Fotosintesis karena menghasilkan glukosa",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Berdasarkan grafik populasi predator dan mangsa, jumlah predator meningkat setelah populasi mangsa meningkat. Analisislah hubungan kedua populasi tersebut.",
    correct: "Ketersediaan mangsa memengaruhi peningkatan populasi predator",
    distractors: [
      "Predator tidak dipengaruhi jumlah mangsa",
      "Mangsa selalu meningkat saat predator meningkat",
      "Predator menghasilkan makanan bagi produsen",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Studi kasus bioremediasi menunjukkan bakteri tertentu digunakan untuk menguraikan limbah minyak di lingkungan tercemar. Evaluasilah alasan penggunaan bakteri tersebut.",
    correct:
      "Bakteri dapat memecah senyawa pencemar menjadi zat yang lebih sederhana",
    distractors: [
      "Bakteri selalu memperbanyak minyak",
      "Bakteri mengubah minyak menjadi klorofil",
      "Bakteri tidak memiliki aktivitas metabolisme",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Evaluasilah dampak penggunaan tanaman transgenik tahan hama terhadap produksi pangan dan lingkungan berdasarkan kemungkinan berkurangnya penggunaan pestisida.",
    correct:
      "Tanaman transgenik dapat meningkatkan produksi, tetapi tetap perlu dikaji dampak ekologisnya",
    distractors: [
      "Tanaman transgenik selalu menghentikan fotosintesis",
      "Tanaman transgenik tidak memiliki DNA",
      "Tanaman transgenik hanya hidup di tubuh hewan",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Studi kasus menunjukkan pembelahan sel yang tidak terkendali menghasilkan massa jaringan abnormal. Analisislah hubungan gangguan siklus sel dengan pembentukan tumor.",
    correct:
      "Gangguan kontrol siklus sel dapat menyebabkan sel membelah berlebihan",
    distractors: [
      "Siklus sel tidak berkaitan dengan pertumbuhan jaringan",
      "Tumor terbentuk karena xilem mengangkut air",
      "Pembelahan sel selalu menghasilkan tumor",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Analisislah dampak erosi tanah pada lahan pertanian terhadap kesuburan tanah dan produktivitas tanaman berdasarkan hilangnya lapisan tanah atas.",
    correct:
      "Erosi menghilangkan lapisan tanah subur sehingga pertumbuhan tanaman dapat menurun",
    distractors: [
      "Erosi selalu menambah unsur hara pada tanah",
      "Erosi tidak memengaruhi akar tanaman",
      "Erosi membuat semua tanaman tumbuh lebih cepat",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Berdasarkan kasus otot yang terasa lelah saat olahraga berat, analisislah hubungan respirasi anaerob dengan terbentuknya asam laktat.",
    correct:
      "Saat oksigen terbatas, sel otot menghasilkan energi melalui fermentasi asam laktat",
    distractors: [
      "Asam laktat terbentuk saat klorofil menyerap cahaya",
      "Respirasi anaerob hanya terjadi di alveolus",
      "Otot tidak membutuhkan energi saat bekerja",
    ],
    weightPriority: "HIGH",
  },
  {
    text: "Perhatikan kasus gangguan hormon tiroid yang menyebabkan metabolisme tubuh meningkat tidak normal. Evaluasilah hubungan hormon tiroid dengan laju metabolisme.",
    correct: "Hormon tiroid berperan mengatur kecepatan metabolisme tubuh",
    distractors: [
      "Hormon tiroid menyaring darah di ginjal",
      "Hormon tiroid mengangkut oksigen seperti hemoglobin",
      "Hormon tiroid hanya terdapat pada tumbuhan",
    ],
    weightPriority: "NORMAL",
  },
  {
    text: "Berdasarkan grafik fotosintesis, laju fotosintesis tidak lagi meningkat meskipun intensitas cahaya terus ditambah. Analisislah kemungkinan faktor pembatas yang menyebabkan kondisi tersebut.",
    correct:
      "Faktor lain seperti karbon dioksida atau suhu menjadi pembatas laju fotosintesis",
    distractors: [
      "Cahaya selalu menjadi satu-satunya faktor fotosintesis",
      "Fotosintesis tidak membutuhkan karbon dioksida",
      "Suhu tidak pernah memengaruhi proses enzimatis",
    ],
    weightPriority: "VERY_HIGH",
  },
  {
    text: "Studi kasus populasi serangga menunjukkan individu dengan warna tubuh mirip lingkungan lebih jarang dimangsa burung. Analisislah hubungan variasi genetik dan seleksi alam pada kasus tersebut.",
    correct:
      "Individu dengan sifat menguntungkan memiliki peluang hidup dan bereproduksi lebih besar",
    distractors: [
      "Variasi genetik tidak memengaruhi kelangsungan hidup",
      "Seleksi alam membuat semua individu memiliki sifat sama dalam satu hari",
      "Burung tidak dapat memengaruhi tekanan seleksi",
    ],
    weightPriority: "VERY_HIGH",
  },
];

function buildQuestions() {
  if (questionSources.length !== 100) {
    throw new Error(
      `Jumlah soal harus 100, sekarang ${questionSources.length}`,
    );
  }

  return questionSources.map((source, index): RawQuestion => {
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
      questionText: `${TEST_PREFIX} ${String(index + 1).padStart(3, "0")}. ${source.text}`,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer: answerOptions[correctIndex] as AnswerOption,
      weightPriority: source.weightPriority,
    };
  });
}

async function main() {
  const subject = await prisma.subject.upsert({
    where: {
      name: "Biologi",
    },
    update: {},
    create: {
      name: "Biologi",
    },
  });

  await prisma.question.deleteMany({
    where: {
      questionText: {
        startsWith: TEST_PREFIX,
      },
    },
  });

  const questions = buildQuestions();

  for (const rawQuestion of questions) {
    const difficulty = classifyQuestionDifficulty(rawQuestion.questionText);
    const weight = getWeightFromPriority(rawQuestion.weightPriority);

    const question = await prisma.question.create({
      data: {
        subjectId: subject.id,
        questionText: rawQuestion.questionText,
        optionA: rawQuestion.optionA,
        optionB: rawQuestion.optionB,
        optionC: rawQuestion.optionC,
        optionD: rawQuestion.optionD,
        correctAnswer: rawQuestion.correctAnswer,
        difficultyLevel: difficulty.difficultyLevel,
        difficultyScore: difficulty.difficultyScore,
        detectedIndicators: difficulty.detectedIndicators,
        weightPriority: rawQuestion.weightPriority,
        weight,
      },
    });

    console.log({
      difficulty: question.difficultyLevel,
      score: question.difficultyScore,
      priority: question.weightPriority,
      weight: question.weight,
      correctAnswer: question.correctAnswer,
      question: question.questionText,
    });
  }

  const answerDistribution = await prisma.question.groupBy({
    by: ["correctAnswer"],
    where: {
      questionText: {
        startsWith: TEST_PREFIX,
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
        startsWith: TEST_PREFIX,
      },
    },
    _count: {
      difficultyLevel: true,
    },
  });

  console.log("Distribusi kunci jawaban:", answerDistribution);
  console.log("Distribusi kesulitan:", difficultyDistribution);
  console.log(`Seed ${questions.length} soal Biologi SMA selesai.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
