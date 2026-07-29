import "../lib/env.js";

import { randomInt } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

import {
  classifyQuestionDifficulty,
  getWeightFromPriority,
} from "../lib/question-difficulty.js";

import type {
  AnswerOption,
  DifficultyLevel,
  TryoutStatus,
  WeightPriority,
} from "../types/domain.js";

const TEACHER_EMAIL = "RahmaHakim@test.com";

const SUBJECT_NAME = "Biologi Kelas 10";

const TRYOUT_TITLE = "Tryout Biologi Kelas 10";

const TRYOUT_TOTAL_QUESTIONS = 10;
const TRYOUT_DURATION_MINUTES = 60;
const TRYOUT_MAX_ATTEMPTS = 3;
const TRYOUT_STATUS: TryoutStatus = "OPEN";

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const JOIN_CODE_LENGTH = 6;
const MAX_JOIN_CODE_ATTEMPTS = 30;

type BaseQuestionSource = {
  text: string;
  correct: string;
  distractors: [string, string, string];
};

type QuestionSource = BaseQuestionSource & {
  expectedDifficulty: DifficultyLevel;
  weightPriority: WeightPriority;
};

type RawQuestion = {
  questionText: string;

  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;

  correctAnswer: AnswerOption;

  expectedDifficulty: DifficultyLevel;

  weightPriority: WeightPriority;
};

const answerOptions: AnswerOption[] = ["A", "B", "C", "D"];

const weightPriorityCycle: WeightPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "VERY_HIGH",
];

/**
 * LOW
 *
 * Total: 34
 */
const lowQuestions: BaseQuestionSource[] = [
  {
    text: "Apa pengertian biologi?",
    correct: "Ilmu yang mempelajari makhluk hidup dan kehidupannya",
    distractors: [
      "Ilmu yang hanya mempelajari benda mati",
      "Ilmu yang hanya mempelajari cuaca",
      "Ilmu yang hanya mempelajari batuan",
    ],
  },
  {
    text: "Apa objek utama yang dipelajari dalam biologi?",
    correct: "Makhluk hidup dan interaksinya dengan lingkungan",
    distractors: [
      "Hanya benda langit",
      "Hanya mineral di dalam tanah",
      "Hanya perubahan cuaca",
    ],
  },
  {
    text: "Apa tingkat organisasi kehidupan yang tersusun atas sekumpulan sel sejenis?",
    correct: "Jaringan",
    distractors: ["Organ", "Populasi", "Ekosistem"],
  },
  {
    text: "Apa fungsi metode ilmiah dalam penelitian biologi?",
    correct: "Membantu memperoleh pengetahuan melalui langkah yang sistematis",
    distractors: [
      "Menggantikan seluruh proses pengamatan",
      "Menghasilkan jawaban tanpa bukti",
      "Menghilangkan kebutuhan terhadap data",
    ],
  },
  {
    text: "Apa ciri-ciri utama virus?",
    correct: "Tidak tersusun atas sel dan memiliki materi genetik",
    distractors: [
      "Selalu memiliki inti sel",
      "Selalu memiliki dinding sel",
      "Mampu melakukan metabolisme sendiri secara lengkap",
    ],
  },
  {
    text: "Apa fungsi kapsid pada virus?",
    correct: "Melindungi materi genetik virus",
    distractors: [
      "Menghasilkan energi untuk virus",
      "Melakukan fotosintesis",
      "Membentuk jaringan tubuh",
    ],
  },
  {
    text: "Apa fungsi materi genetik pada virus?",
    correct: "Menyimpan informasi genetik virus",
    distractors: [
      "Menghasilkan makanan sendiri",
      "Mengangkut oksigen",
      "Menyerap mineral dari tanah",
    ],
  },
  {
    text: "Apa contoh virus yang menyerang bakteri?",
    correct: "Bakteriofag",
    distractors: ["Rhizobium", "Amoeba", "Saccharomyces"],
  },
  {
    text: "Apa ciri-ciri utama bakteri?",
    correct: "Bersifat prokariotik dan umumnya bersel satu",
    distractors: [
      "Selalu memiliki membran inti",
      "Selalu tersusun atas banyak sel",
      "Tidak memiliki materi genetik",
    ],
  },
  {
    text: "Apa cara reproduksi bakteri yang paling umum?",
    correct: "Pembelahan biner",
    distractors: ["Fragmentasi jaringan", "Penyerbukan", "Pembentukan biji"],
  },
  {
    text: "Apa contoh bakteri yang membantu mengikat nitrogen?",
    correct: "Rhizobium",
    distractors: ["Plasmodium", "Amoeba", "Rhizopus"],
  },
  {
    text: "Apa ciri-ciri Archaea?",
    correct: "Prokariotik dan banyak ditemukan pada lingkungan ekstrem",
    distractors: [
      "Selalu bersifat multiseluler",
      "Memiliki jaringan pembuluh",
      "Selalu memiliki kloroplas",
    ],
  },
  {
    text: "Apa ciri-ciri umum Protista?",
    correct: "Eukariotik dan sebagian besar memiliki struktur tubuh sederhana",
    distractors: [
      "Selalu prokariotik",
      "Selalu memiliki jaringan sejati",
      "Tidak memiliki materi genetik",
    ],
  },
  {
    text: "Apa contoh Protista yang bergerak menggunakan kaki semu?",
    correct: "Amoeba",
    distractors: ["Paramecium", "Euglena", "Spirogyra"],
  },
  {
    text: "Apa contoh Protista yang bergerak menggunakan silia?",
    correct: "Paramecium",
    distractors: ["Amoeba", "Plasmodium", "Rhizopus"],
  },
  {
    text: "Apa ciri-ciri utama jamur?",
    correct: "Eukariotik dan memperoleh makanan secara heterotrof",
    distractors: [
      "Selalu berfotosintesis",
      "Tidak memiliki membran sel",
      "Selalu bersifat prokariotik",
    ],
  },
  {
    text: "Apa fungsi hifa pada jamur?",
    correct: "Menyerap nutrisi dan membentuk tubuh jamur",
    distractors: [
      "Menghasilkan klorofil",
      "Mengangkut darah",
      "Menghasilkan biji",
    ],
  },
  {
    text: "Apa pengertian miselium?",
    correct: "Kumpulan hifa yang membentuk tubuh jamur",
    distractors: [
      "Kumpulan akar tumbuhan",
      "Kumpulan sel darah",
      "Kumpulan kapsid virus",
    ],
  },
  {
    text: "Apa pengertian lumut kerak?",
    correct: "Simbiosis antara jamur dengan organisme fotosintetik",
    distractors: [
      "Simbiosis antara dua hewan",
      "Koloni bakteri patogen",
      "Jaringan pengangkut pada tumbuhan",
    ],
  },
  {
    text: "Apa ciri-ciri utama Kingdom Plantae?",
    correct: "Eukariotik, multiseluler, dan umumnya melakukan fotosintesis",
    distractors: [
      "Prokariotik dan tidak memiliki membran sel",
      "Selalu bersel satu",
      "Tidak memiliki klorofil",
    ],
  },
  {
    text: "Apa contoh tumbuhan yang termasuk Bryophyta?",
    correct: "Lumut",
    distractors: ["Paku", "Pinus", "Mangga"],
  },
  {
    text: "Apa ciri-ciri tumbuhan paku?",
    correct: "Memiliki jaringan pembuluh dan berkembang biak dengan spora",
    distractors: [
      "Tidak memiliki akar, batang, dan daun sejati",
      "Menghasilkan biji tertutup",
      "Tidak memiliki jaringan pengangkut",
    ],
  },
  {
    text: "Apa ciri-ciri Gymnospermae?",
    correct: "Memiliki biji yang tidak tertutup oleh buah",
    distractors: [
      "Tidak menghasilkan biji",
      "Selalu berkembang biak dengan spora",
      "Tidak memiliki jaringan pembuluh",
    ],
  },
  {
    text: "Apa ciri-ciri Angiospermae?",
    correct: "Menghasilkan bunga dan biji yang terlindungi oleh buah",
    distractors: [
      "Tidak menghasilkan biji",
      "Tidak memiliki jaringan pembuluh",
      "Hanya berkembang biak menggunakan spora",
    ],
  },
  {
    text: "Apa ciri-ciri utama Kingdom Animalia?",
    correct: "Eukariotik, multiseluler, dan heterotrof",
    distractors: [
      "Prokariotik dan autotrof",
      "Tidak memiliki membran sel",
      "Selalu melakukan fotosintesis",
    ],
  },
  {
    text: "Apa ciri-ciri Porifera?",
    correct: "Tubuh memiliki banyak pori",
    distractors: [
      "Tubuh memiliki tulang belakang",
      "Tubuh selalu memiliki kaki berbuku-buku",
      "Tubuh memiliki daun",
    ],
  },
  {
    text: "Apa ciri-ciri Cnidaria?",
    correct: "Memiliki sel penyengat",
    distractors: [
      "Memiliki bulu dan sayap",
      "Memiliki akar sejati",
      "Memiliki dinding sel dari kitin",
    ],
  },
  {
    text: "Apa ciri-ciri Mollusca?",
    correct: "Umumnya memiliki tubuh lunak",
    distractors: [
      "Tubuh selalu beruas dengan kaki berbuku",
      "Tubuh selalu memiliki tulang belakang",
      "Tubuh tersusun atas hifa",
    ],
  },
  {
    text: "Apa ciri-ciri Arthropoda?",
    correct: "Memiliki kaki berbuku-buku dan rangka luar",
    distractors: [
      "Tidak memiliki simetri tubuh",
      "Memiliki akar dan daun",
      "Tubuh tersusun atas miselium",
    ],
  },
  {
    text: "Apa pengertian ekosistem?",
    correct: "Interaksi antara makhluk hidup dengan lingkungan",
    distractors: [
      "Kumpulan organ dalam tubuh",
      "Kumpulan sel sejenis",
      "Satu organisme tanpa lingkungannya",
    ],
  },
  {
    text: "Apa fungsi produsen dalam ekosistem?",
    correct: "Menghasilkan bahan organik sebagai sumber energi",
    distractors: [
      "Menguraikan seluruh bahan organik",
      "Memakan semua konsumen",
      "Menghilangkan energi dari ekosistem",
    ],
  },
  {
    text: "Apa fungsi dekomposer dalam ekosistem?",
    correct: "Menguraikan sisa makhluk hidup",
    distractors: [
      "Menghasilkan cahaya",
      "Menjadi sumber energi utama matahari",
      "Membentuk jaringan tumbuhan",
    ],
  },
  {
    text: "Apa pengertian rantai makanan?",
    correct: "Urutan perpindahan energi melalui proses makan dan dimakan",
    distractors: [
      "Urutan pembentukan organ tubuh",
      "Urutan pembelahan bakteri",
      "Urutan klasifikasi makhluk hidup",
    ],
  },
  {
    text: "Apa pengertian keanekaragaman hayati?",
    correct: "Variasi makhluk hidup pada berbagai tingkat kehidupan",
    distractors: [
      "Kesamaan semua makhluk hidup",
      "Jumlah benda mati dalam lingkungan",
      "Perubahan cuaca dalam suatu wilayah",
    ],
  },
];

/**
 * MEDIUM
 *
 * Total: 33
 */
const mediumQuestions: BaseQuestionSource[] = [
  {
    text: "Jelaskan alasan virus tidak digolongkan sebagai organisme bersel.",
    correct:
      "Virus tidak memiliki struktur sel seperti membran sel, sitoplasma, dan organel",
    distractors: [
      "Virus selalu memiliki banyak sel",
      "Virus memiliki jaringan pembuluh",
      "Virus memiliki inti sel lengkap",
    ],
  },
  {
    text: "Mengapa virus disebut parasit intraseluler obligat?",
    correct:
      "Virus hanya dapat memperbanyak diri dengan memanfaatkan sel inang",
    distractors: [
      "Virus dapat hidup bebas tanpa sel lain",
      "Virus selalu menghasilkan makanan sendiri",
      "Virus mampu membentuk jaringan tubuh",
    ],
  },
  {
    text: "Bedakan daur litik dan daur lisogenik pada reproduksi virus.",
    correct:
      "Daur litik segera menghancurkan sel inang, sedangkan lisogenik menyisipkan materi genetik terlebih dahulu",
    distractors: [
      "Keduanya selalu langsung menghancurkan sel",
      "Daur lisogenik tidak melibatkan materi genetik",
      "Daur litik hanya terjadi pada tumbuhan",
    ],
  },
  {
    text: "Jelaskan peran bakteri dalam pembuatan makanan fermentasi.",
    correct: "Bakteri mengubah bahan tertentu menjadi produk hasil fermentasi",
    distractors: [
      "Bakteri menghentikan seluruh reaksi kimia",
      "Bakteri menghasilkan cahaya untuk makanan",
      "Bakteri mengubah semua zat menjadi oksigen",
    ],
  },
  {
    text: "Mengapa penggunaan antibiotik yang tidak tepat dapat meningkatkan resistensi bakteri?",
    correct: "Bakteri yang tahan dapat bertahan dan berkembang biak",
    distractors: [
      "Antibiotik mengubah bakteri menjadi virus",
      "Semua bakteri langsung kehilangan DNA",
      "Antibiotik membuat bakteri berfotosintesis",
    ],
  },
  {
    text: "Klasifikasikan Protista berdasarkan cara memperoleh makanannya.",
    correct:
      "Protista dapat bersifat autotrof, heterotrof, atau memiliki kombinasi keduanya",
    distractors: [
      "Semua Protista hanya autotrof",
      "Semua Protista hanya parasit",
      "Semua Protista memiliki cara makan yang sama",
    ],
  },
  {
    text: "Jelaskan peran jamur sebagai dekomposer dalam lingkungan.",
    correct:
      "Jamur menguraikan sisa organisme menjadi senyawa yang lebih sederhana",
    distractors: [
      "Jamur menghasilkan seluruh energi matahari",
      "Jamur menghentikan daur materi",
      "Jamur selalu menjadi produsen",
    ],
  },
  {
    text: "Bandingkan lumut dan tumbuhan paku berdasarkan jaringan pengangkut.",
    correct: "Paku memiliki jaringan pengangkut sejati sedangkan lumut tidak",
    distractors: [
      "Lumut memiliki pembuluh lebih lengkap daripada paku",
      "Keduanya tidak memiliki jaringan pengangkut",
      "Keduanya memiliki biji tertutup",
    ],
  },
  {
    text: "Bedakan Gymnospermae dan Angiospermae berdasarkan keadaan bijinya.",
    correct:
      "Gymnospermae memiliki biji terbuka sedangkan Angiospermae memiliki biji tertutup",
    distractors: [
      "Gymnospermae tidak memiliki biji",
      "Angiospermae hanya menghasilkan spora",
      "Keduanya tidak memiliki jaringan pembuluh",
    ],
  },
  {
    text: "Jelaskan peran bunga dalam reproduksi tumbuhan berbiji tertutup.",
    correct:
      "Bunga menjadi tempat organ reproduksi dan membantu terjadinya pembuahan",
    distractors: [
      "Bunga menggantikan fungsi akar",
      "Bunga menjadi satu-satunya tempat respirasi",
      "Bunga membentuk jaringan pembuluh",
    ],
  },
  {
    text: "Mengapa tumbuhan mangrove mampu hidup pada lingkungan berkadar garam tinggi?",
    correct:
      "Mangrove memiliki adaptasi yang membantu mengatur kadar garam dan air",
    distractors: [
      "Mangrove tidak membutuhkan air",
      "Mangrove tidak memiliki membran sel",
      "Mangrove selalu menyerap seluruh garam",
    ],
  },
  {
    text: "Jelaskan dasar pengelompokan hewan berdasarkan simetri tubuh.",
    correct:
      "Hewan dapat dikelompokkan berdasarkan pola pembagian bagian tubuhnya",
    distractors: [
      "Semua hewan memiliki simetri yang sama",
      "Simetri hanya ditentukan warna tubuh",
      "Simetri tidak berkaitan dengan susunan tubuh",
    ],
  },
  {
    text: "Klasifikasikan hewan vertebrata berdasarkan ciri penutup tubuhnya.",
    correct:
      "Kelompok vertebrata memiliki penutup tubuh yang berbeda seperti sisik, kulit, bulu, atau rambut",
    distractors: [
      "Semua vertebrata memiliki bulu",
      "Semua vertebrata memiliki rangka luar",
      "Penutup tubuh tidak dapat digunakan sebagai ciri",
    ],
  },
  {
    text: "Mengapa rangka luar menguntungkan bagi Arthropoda?",
    correct: "Rangka luar melindungi tubuh dan menjadi tempat melekatnya otot",
    distractors: [
      "Rangka luar menghasilkan makanan",
      "Rangka luar menggantikan sistem pencernaan",
      "Rangka luar membuat hewan tidak perlu bergerak",
    ],
  },
  {
    text: "Jelaskan peran produsen dalam aliran energi suatu ekosistem.",
    correct:
      "Produsen mengubah energi menjadi bahan organik yang dapat digunakan organisme lain",
    distractors: [
      "Produsen hanya memperoleh energi dari konsumen",
      "Produsen menghilangkan seluruh energi",
      "Produsen tidak berhubungan dengan konsumen",
    ],
  },
  {
    text: "Mengapa jaring-jaring makanan lebih kompleks daripada rantai makanan?",
    correct:
      "Jaring-jaring makanan menunjukkan banyak hubungan makan antarorganisme",
    distractors: [
      "Jaring-jaring makanan hanya memiliki satu organisme",
      "Rantai makanan selalu memiliki lebih banyak hubungan",
      "Jaring-jaring makanan tidak menunjukkan aliran energi",
    ],
  },
  {
    text: "Mengapa energi berkurang pada tingkat trofik yang lebih tinggi?",
    correct:
      "Sebagian energi digunakan dalam aktivitas hidup dan dilepas sebagai panas",
    distractors: [
      "Energi selalu bertambah pada setiap tingkat",
      "Semua energi berpindah tanpa kehilangan",
      "Konsumen menghasilkan energi baru",
    ],
  },
  {
    text: "Jelaskan peran tumbuhan dalam siklus karbon.",
    correct:
      "Tumbuhan menyerap karbon dioksida untuk membentuk bahan organik melalui fotosintesis",
    distractors: [
      "Tumbuhan menghentikan seluruh siklus karbon",
      "Tumbuhan tidak menyerap karbon",
      "Tumbuhan mengubah karbon menjadi air saja",
    ],
  },
  {
    text: "Jelaskan peran bakteri pengikat nitrogen dalam ekosistem.",
    correct:
      "Bakteri membantu mengubah nitrogen menjadi bentuk yang dapat digunakan tumbuhan",
    distractors: [
      "Bakteri menghilangkan seluruh nitrogen",
      "Bakteri mengubah nitrogen menjadi cahaya",
      "Bakteri menghentikan pertumbuhan tumbuhan",
    ],
  },
  {
    text: "Jelaskan proses perpindahan air dalam siklus air.",
    correct:
      "Air berpindah melalui penguapan, kondensasi, presipitasi, dan aliran kembali",
    distractors: [
      "Air hanya berpindah melalui fotosintesis",
      "Air tidak mengalami perubahan tempat",
      "Air selalu tetap berada di laut",
    ],
  },
  {
    text: "Jelaskan hubungan mutualisme antara dua organisme.",
    correct: "Kedua organisme memperoleh keuntungan dari interaksi tersebut",
    distractors: [
      "Kedua organisme selalu dirugikan",
      "Satu organisme mati tanpa interaksi",
      "Tidak ada organisme yang memperoleh manfaat",
    ],
  },
  {
    text: "Jelaskan akibat kompetisi terhadap organisme dalam suatu habitat.",
    correct:
      "Kompetisi dapat memengaruhi akses organisme terhadap sumber daya terbatas",
    distractors: [
      "Kompetisi selalu meningkatkan semua sumber daya",
      "Kompetisi tidak memengaruhi populasi",
      "Kompetisi hanya terjadi pada benda mati",
    ],
  },
  {
    text: "Mengapa jumlah populasi dapat meningkat ketika sumber daya melimpah?",
    correct:
      "Ketersediaan makanan dan ruang mendukung kelangsungan hidup dan reproduksi",
    distractors: [
      "Sumber daya melimpah selalu menghentikan reproduksi",
      "Populasi tidak membutuhkan makanan",
      "Pertumbuhan populasi tidak dipengaruhi lingkungan",
    ],
  },
  {
    text: "Tentukan komponen biotik pada suatu ekosistem sawah.",
    correct: "Padi, serangga, burung, dan mikroorganisme",
    distractors: [
      "Air, tanah, cahaya, dan suhu",
      "Batu, udara, air, dan mineral",
      "Suhu, kelembapan, angin, dan cahaya",
    ],
  },
  {
    text: "Klasifikasikan konservasi berdasarkan tempat pelaksanaannya.",
    correct: "Konservasi dapat dilakukan secara in situ maupun ex situ",
    distractors: [
      "Konservasi hanya dapat dilakukan di kebun binatang",
      "Konservasi hanya dapat dilakukan di hutan",
      "Konservasi tidak membutuhkan habitat",
    ],
  },
  {
    text: "Jelaskan manfaat keanekaragaman hayati bagi kehidupan manusia.",
    correct:
      "Keanekaragaman menyediakan sumber pangan, obat, bahan baku, dan jasa lingkungan",
    distractors: [
      "Keanekaragaman tidak memiliki manfaat",
      "Keanekaragaman hanya menyebabkan persaingan",
      "Keanekaragaman selalu mengurangi sumber daya",
    ],
  },
  {
    text: "Mengapa spesies endemik lebih rentan terhadap perubahan habitat?",
    correct: "Sebaran spesies endemik terbatas pada wilayah tertentu",
    distractors: [
      "Spesies endemik hidup di seluruh dunia",
      "Spesies endemik tidak membutuhkan habitat",
      "Spesies endemik selalu berkembang biak sangat cepat",
    ],
  },
  {
    text: "Jelaskan akibat fragmentasi habitat terhadap populasi satwa.",
    correct:
      "Fragmentasi dapat memisahkan populasi dan membatasi pergerakan serta perkawinan",
    distractors: [
      "Fragmentasi selalu memperluas habitat",
      "Fragmentasi menghilangkan seluruh kompetisi",
      "Fragmentasi tidak memengaruhi satwa",
    ],
  },
  {
    text: "Jelaskan penyebab eutrofikasi pada suatu perairan.",
    correct:
      "Masuknya nutrien berlebih dapat memicu pertumbuhan alga secara berlebihan",
    distractors: [
      "Kekurangan seluruh nutrien",
      "Tidak adanya organisme air",
      "Berkurangnya cahaya matahari secara total",
    ],
  },
  {
    text: "Jelaskan proses terjadinya efek rumah kaca.",
    correct:
      "Gas tertentu menahan sebagian panas sehingga suhu atmosfer meningkat",
    distractors: [
      "Atmosfer melepaskan seluruh panas ke luar angkasa",
      "Gas rumah kaca menghilangkan cahaya matahari",
      "Efek rumah kaca hanya terjadi di dalam rumah",
    ],
  },
  {
    text: "Jelaskan akibat penumpukan zat pencemar pada rantai makanan.",
    correct:
      "Konsentrasi zat pencemar dapat meningkat pada organisme tingkat trofik lebih tinggi",
    distractors: [
      "Zat pencemar selalu hilang pada konsumen",
      "Semua organisme memiliki kadar pencemar sama",
      "Pencemar berubah menjadi nutrisi",
    ],
  },
  {
    text: "Bedakan suksesi primer dan suksesi sekunder.",
    correct:
      "Suksesi primer dimulai tanpa tanah sedangkan suksesi sekunder terjadi pada area yang masih memiliki tanah",
    distractors: [
      "Keduanya hanya terjadi di laut",
      "Suksesi sekunder selalu dimulai tanpa tanah",
      "Suksesi primer tidak melibatkan organisme",
    ],
  },
  {
    text: "Jelaskan hubungan piramida ekologi dengan tingkat trofik.",
    correct:
      "Piramida ekologi menggambarkan perbandingan jumlah, biomassa, atau energi antar tingkat trofik",
    distractors: [
      "Piramida ekologi hanya menunjukkan warna organisme",
      "Piramida tidak berkaitan dengan tingkat trofik",
      "Setiap tingkat selalu memiliki energi yang sama",
    ],
  },
];

/**
 * HIGH
 *
 * Total: 33
 */
const highQuestions: BaseQuestionSource[] = [
  {
    text: "Analisis perubahan materi genetik virus lalu simpulkan dampaknya terhadap kemampuan virus menginfeksi inang.",
    correct:
      "Perubahan materi genetik dapat mengubah sifat virus termasuk kemampuan mengenali atau menginfeksi sel inang",
    distractors: [
      "Perubahan genetik selalu membuat virus kehilangan materi genetik",
      "Virus tidak memiliki materi genetik sehingga tidak dapat berubah",
      "Perubahan genetik hanya mengubah ukuran sel inang",
    ],
  },
  {
    text: "Analisis kondisi virus yang memasukkan materi genetik ke sel inang lalu simpulkan jenis daur reproduksinya.",
    correct: "Kondisi tersebut menunjukkan daur lisogenik",
    distractors: [
      "Kondisi tersebut selalu menunjukkan pembelahan biner",
      "Kondisi tersebut menunjukkan fotosintesis",
      "Kondisi tersebut menunjukkan fermentasi",
    ],
  },
  {
    text: "Analisis penggunaan antibiotik berulang pada populasi bakteri lalu simpulkan penyebab meningkatnya bakteri resisten.",
    correct:
      "Bakteri yang memiliki ketahanan lebih besar bertahan dan menghasilkan keturunan",
    distractors: [
      "Antibiotik mengubah semua bakteri menjadi virus",
      "Semua bakteri memperoleh ketahanan yang sama secara langsung",
      "Bakteri kehilangan seluruh materi genetik",
    ],
  },
  {
    text: "Analisis populasi bakteri yang mulai kekurangan nutrisi lalu prediksi perubahan laju pertumbuhannya.",
    correct:
      "Laju pertumbuhan akan melambat karena sumber daya menjadi terbatas",
    distractors: [
      "Pertumbuhan terus meningkat tanpa batas",
      "Nutrisi tidak memengaruhi pertumbuhan bakteri",
      "Semua bakteri langsung berubah menjadi spora tumbuhan",
    ],
  },
  {
    text: "Analisis ledakan alga di suatu danau lalu simpulkan pengaruhnya terhadap kadar oksigen terlarut.",
    correct:
      "Oksigen dapat menurun akibat peningkatan proses penguraian organisme",
    distractors: [
      "Oksigen selalu meningkat tanpa batas",
      "Alga tidak memengaruhi organisme lain",
      "Penguraian tidak membutuhkan oksigen",
    ],
  },
  {
    text: "Analisis pemutihan terumbu karang lalu prediksi dampaknya terhadap organisme yang bergantung pada karang.",
    correct:
      "Populasi organisme yang menggunakan karang sebagai habitat atau sumber makanan dapat menurun",
    distractors: [
      "Semua organisme laut akan meningkat",
      "Pemutihan karang selalu menambah habitat",
      "Karang tidak berhubungan dengan organisme lain",
    ],
  },
  {
    text: "Analisis deforestasi pada daerah hulu lalu simpulkan pengaruhnya terhadap aliran air permukaan.",
    correct:
      "Aliran permukaan dapat meningkat karena berkurangnya vegetasi yang menyerap dan menahan air",
    distractors: [
      "Aliran permukaan selalu berhenti",
      "Deforestasi menambah jumlah akar",
      "Vegetasi tidak berperan dalam pergerakan air",
    ],
  },
  {
    text: "Analisis masuknya spesies invasif ke habitat baru lalu prediksi dampaknya terhadap spesies lokal.",
    correct:
      "Spesies lokal dapat tertekan akibat kompetisi, predasi, atau perubahan habitat",
    distractors: [
      "Spesies invasif selalu membantu semua spesies lokal",
      "Tidak akan terjadi interaksi antarpopulasi",
      "Semua spesies lokal otomatis menjadi produsen",
    ],
  },
  {
    text: "Analisis penggunaan pestisida berlebihan lalu simpulkan dampaknya terhadap organisme non-target.",
    correct:
      "Organisme non-target dapat ikut terdampak sehingga keseimbangan ekosistem terganggu",
    distractors: [
      "Pestisida hanya memengaruhi satu organisme sasaran",
      "Semua organisme non-target menjadi kebal secara langsung",
      "Pestisida selalu meningkatkan keanekaragaman",
    ],
  },
  {
    text: "Analisis hilangnya predator puncak dari jaring-jaring makanan lalu prediksi perubahan populasi mangsa.",
    correct:
      "Populasi mangsa berpotensi meningkat karena tekanan predasi menurun",
    distractors: [
      "Populasi mangsa pasti langsung punah",
      "Mangsa tidak dipengaruhi predator",
      "Predator puncak menghasilkan makanan bagi mangsa",
    ],
  },
  {
    text: "Analisis penurunan jumlah produsen lalu simpulkan dampaknya terhadap konsumen pada tingkat trofik berikutnya.",
    correct: "Energi dan sumber makanan bagi konsumen akan berkurang",
    distractors: [
      "Energi konsumen selalu meningkat",
      "Produsen tidak berperan dalam aliran energi",
      "Konsumen dapat menghasilkan seluruh energinya sendiri",
    ],
  },
  {
    text: "Analisis perpindahan energi dalam piramida makanan lalu simpulkan alasan jumlah energi semakin kecil pada tingkat atas.",
    correct:
      "Sebagian besar energi digunakan untuk aktivitas hidup dan hilang sebagai panas",
    distractors: [
      "Energi diciptakan kembali pada setiap tingkat",
      "Seluruh energi berpindah tanpa kehilangan",
      "Organisme tingkat atas menghasilkan energi dari udara",
    ],
  },
  {
    text: "Analisis peningkatan karbon dioksida atmosfer lalu prediksi pengaruhnya terhadap suhu bumi.",
    correct:
      "Peningkatan karbon dioksida dapat memperkuat efek rumah kaca dan meningkatkan suhu rata-rata",
    distractors: [
      "Karbon dioksida selalu menurunkan suhu bumi",
      "Karbon dioksida tidak berinteraksi dengan panas",
      "Suhu bumi hanya dipengaruhi oleh organisme",
    ],
  },
  {
    text: "Analisis limpasan pupuk ke perairan lalu simpulkan penyebab terjadinya eutrofikasi.",
    correct: "Nutrien berlebih mendorong pertumbuhan alga secara berlebihan",
    distractors: [
      "Pupuk menghilangkan seluruh nutrien",
      "Alga tidak menggunakan nutrien",
      "Eutrofikasi terjadi akibat kekurangan air",
    ],
  },
  {
    text: "Analisis kerusakan hutan mangrove lalu prediksi dampaknya terhadap perlindungan wilayah pesisir.",
    correct: "Kemampuan pesisir menahan gelombang dan erosi dapat berkurang",
    distractors: [
      "Kerusakan mangrove selalu menghentikan gelombang",
      "Mangrove tidak memiliki hubungan dengan pesisir",
      "Erosi selalu menurun setelah mangrove hilang",
    ],
  },
  {
    text: "Analisis terbentuknya habitat baru pada permukaan lava lalu simpulkan jenis suksesi yang terjadi.",
    correct: "Suksesi primer",
    distractors: [
      "Suksesi sekunder",
      "Kompetisi intraspesifik",
      "Simbiosis parasitisme",
    ],
  },
  {
    text: "Analisis pemulihan vegetasi setelah kebakaran yang masih menyisakan tanah lalu simpulkan jenis suksesinya.",
    correct: "Suksesi sekunder",
    distractors: ["Suksesi primer", "Pembelahan biner", "Daur litik"],
  },
  {
    text: "Analisis ancaman terhadap spesies endemik lalu argumentasikan strategi konservasi yang paling sesuai.",
    correct:
      "Melindungi habitat alami dan mengurangi penyebab utama penurunan populasi",
    distractors: [
      "Menghilangkan seluruh habitat alami",
      "Membiarkan eksploitasi tanpa pembatasan",
      "Memindahkan seluruh spesies tanpa kajian",
    ],
  },
  {
    text: "Analisis program penangkaran satwa lalu evaluasi keterbatasannya sebagai strategi konservasi.",
    correct:
      "Penangkaran membantu populasi tetapi tetap memerlukan perlindungan habitat dan keragaman genetik",
    distractors: [
      "Penangkaran membuat habitat alami tidak diperlukan",
      "Penangkaran selalu menjamin seluruh spesies bertahan",
      "Keragaman genetik tidak penting dalam penangkaran",
    ],
  },
  {
    text: "Analisis beberapa ciri organisme lalu simpulkan alasan klasifikasi diperlukan dalam biologi.",
    correct:
      "Klasifikasi membantu mengelompokkan organisme berdasarkan persamaan dan perbedaan cirinya",
    distractors: [
      "Klasifikasi membuat semua organisme dianggap sama",
      "Klasifikasi menghilangkan hubungan antarorganisme",
      "Klasifikasi hanya digunakan untuk menentukan warna",
    ],
  },
  {
    text: "Analisis organisme eukariotik bersel satu yang bergerak aktif lalu simpulkan kelompok yang paling mungkin.",
    correct: "Protista",
    distractors: ["Archaea", "Bakteri", "Plantae"],
  },
  {
    text: "Analisis organisme heterotrof berdinding sel kitin lalu simpulkan kingdom yang paling sesuai.",
    correct: "Fungi",
    distractors: ["Plantae", "Animalia", "Monera"],
  },
  {
    text: "Analisis tumbuhan yang memiliki pembuluh tetapi berkembang biak dengan spora lalu simpulkan kelompoknya.",
    correct: "Pteridophyta",
    distractors: ["Bryophyta", "Gymnospermae", "Angiospermae"],
  },
  {
    text: "Analisis tumbuhan yang menghasilkan biji terbuka pada strobilus lalu simpulkan kelompoknya.",
    correct: "Gymnospermae",
    distractors: ["Bryophyta", "Pteridophyta", "Angiospermae"],
  },
  {
    text: "Analisis hewan bersimetri radial dengan sel penyengat lalu simpulkan filum yang paling sesuai.",
    correct: "Cnidaria",
    distractors: ["Porifera", "Mollusca", "Arthropoda"],
  },
  {
    text: "Analisis hewan yang memiliki rangka luar dan kaki berbuku-buku lalu simpulkan filumnya.",
    correct: "Arthropoda",
    distractors: ["Mollusca", "Cnidaria", "Porifera"],
  },
  {
    text: "Analisis perubahan kondisi air yang menyebabkan ikan sering muncul ke permukaan lalu simpulkan kemungkinan masalah lingkungannya.",
    correct:
      "Kadar oksigen terlarut kemungkinan menurun sehingga ikan kesulitan memperoleh oksigen",
    distractors: [
      "Air memiliki terlalu banyak oksigen",
      "Ikan tidak membutuhkan oksigen",
      "Semua organisme air berhenti melakukan respirasi",
    ],
  },
  {
    text: "Analisis berkurangnya organisme indikator yang sensitif terhadap pencemaran lalu simpulkan kondisi kualitas lingkungan.",
    correct:
      "Kualitas lingkungan kemungkinan menurun akibat adanya tekanan atau pencemaran",
    distractors: [
      "Lingkungan pasti semakin sehat",
      "Organisme indikator tidak berkaitan dengan lingkungan",
      "Pencemaran selalu meningkatkan organisme sensitif",
    ],
  },
  {
    text: "Analisis populasi yang mendekati daya dukung lingkungan lalu prediksi perubahan laju pertumbuhannya.",
    correct:
      "Laju pertumbuhan cenderung melambat karena sumber daya semakin terbatas",
    distractors: [
      "Laju pertumbuhan terus meningkat tanpa batas",
      "Daya dukung tidak memengaruhi populasi",
      "Populasi tidak membutuhkan sumber daya",
    ],
  },
  {
    text: "Analisis gangguan pada hubungan mutualisme lalu prediksi dampaknya terhadap kedua organisme.",
    correct:
      "Keduanya dapat mengalami penurunan keuntungan atau keberhasilan hidup",
    distractors: [
      "Keduanya selalu memperoleh manfaat lebih besar",
      "Mutualisme tidak memberi manfaat",
      "Gangguan tidak pernah memengaruhi organisme",
    ],
  },
  {
    text: "Analisis pembuangan sampah organik dalam jumlah besar ke sungai lalu simpulkan dampaknya terhadap kualitas air.",
    correct:
      "Penguraian bahan organik dapat meningkatkan kebutuhan oksigen dan menurunkan kualitas air",
    distractors: [
      "Sampah organik selalu meningkatkan oksigen",
      "Penguraian tidak melibatkan mikroorganisme",
      "Kualitas air tidak dipengaruhi limbah",
    ],
  },
  {
    text: "Analisis beberapa strategi pengelolaan sampah lalu evaluasi pendekatan yang paling mendukung keberlanjutan.",
    correct:
      "Mengurangi sampah dari sumber, menggunakan kembali, dan mendaur ulang lebih baik daripada hanya membuang",
    distractors: [
      "Membuang semua sampah ke sungai",
      "Membakar seluruh sampah tanpa pengendalian",
      "Mencampur seluruh limbah tanpa pemilahan",
    ],
  },
  {
    text: "Analisis kerusakan habitat yang terjadi terus-menerus lalu prediksi pengaruhnya terhadap keanekaragaman hayati.",
    correct:
      "Keanekaragaman dapat menurun karena organisme kehilangan tempat hidup dan sumber daya",
    distractors: [
      "Keanekaragaman selalu meningkat",
      "Habitat tidak dibutuhkan organisme",
      "Kerusakan habitat hanya memengaruhi benda mati",
    ],
  },
];

function assignWrsPriorities(
  questions: BaseQuestionSource[],
  expectedDifficulty: DifficultyLevel,
  startIndex: number,
): QuestionSource[] {
  return questions.map((question, index) => {
    const globalIndex = startIndex + index;

    const weightPriority =
      weightPriorityCycle[globalIndex % weightPriorityCycle.length] ?? "NORMAL";

    return {
      ...question,
      expectedDifficulty,
      weightPriority,
    };
  });
}

const biologySources: QuestionSource[] = [
  ...assignWrsPriorities(lowQuestions, "LOW", 0),

  ...assignWrsPriorities(mediumQuestions, "MEDIUM", lowQuestions.length),

  ...assignWrsPriorities(
    highQuestions,
    "HIGH",
    lowQuestions.length + mediumQuestions.length,
  ),
];

function assertQuestionCounts() {
  if (lowQuestions.length !== 34) {
    throw new Error(`Soal LOW harus 34, sekarang ${lowQuestions.length}.`);
  }

  if (mediumQuestions.length !== 33) {
    throw new Error(
      `Soal MEDIUM harus 33, sekarang ${mediumQuestions.length}.`,
    );
  }

  if (highQuestions.length !== 33) {
    throw new Error(`Soal HIGH harus 33, sekarang ${highQuestions.length}.`);
  }

  if (biologySources.length !== 100) {
    throw new Error(
      `Total soal Biologi Kelas 10 harus 100, sekarang ${biologySources.length}.`,
    );
  }
}

function buildQuestions(sources: QuestionSource[]) {
  return sources.map((source, index): RawQuestion => {
    const correctIndex = index % answerOptions.length;

    const choices = [...source.distractors];

    choices.splice(correctIndex, 0, source.correct);

    const [optionA, optionB, optionC, optionD] = choices as [
      string,
      string,
      string,
      string,
    ];

    return {
      questionText: source.text,

      optionA,
      optionB,
      optionC,
      optionD,

      correctAnswer: answerOptions[correctIndex] ?? "A",

      expectedDifficulty: source.expectedDifficulty,

      weightPriority: source.weightPriority,
    };
  });
}

function generateJoinCodeCandidate() {
  let code = "";

  for (let index = 0; index < JOIN_CODE_LENGTH; index += 1) {
    const randomIndex = randomInt(0, JOIN_CODE_ALPHABET.length);

    code += JOIN_CODE_ALPHABET[randomIndex];
  }

  return code;
}

async function generateUniqueJoinCode() {
  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt += 1) {
    const joinCode = generateJoinCodeCandidate();

    const existingTryout = await prisma.tryout.findUnique({
      where: {
        joinCode,
      },

      select: {
        id: true,
      },
    });

    if (!existingTryout) {
      return joinCode;
    }
  }

  throw new Error("Gagal membuat join code unik untuk tryout.");
}

async function getTeacher() {
  const teacher = await prisma.user.findFirst({
    where: {
      email: {
        equals: TEACHER_EMAIL,
        mode: "insensitive",
      },
    },
  });

  if (!teacher) {
    throw new Error(
      `Akun guru ${TEACHER_EMAIL} tidak ditemukan. Jalankan seed akun terlebih dahulu.`,
    );
  }

  if (teacher.role !== "TEACHER") {
    throw new Error(
      `${teacher.email} ditemukan tetapi role-nya bukan TEACHER.`,
    );
  }

  return teacher;
}

/**
 * Hanya mencari subject existing.
 *
 * Jangan create dulu sebelum pengecekan
 * apakah seed sebelumnya sudah pernah dijalankan.
 */
async function findExistingSubject(teacherId: string) {
  return prisma.subject.findFirst({
    where: {
      ownerId: teacherId,
      name: SUBJECT_NAME,
    },
  });
}

/**
 * Guard utama.
 *
 * Kalau bank yang sama sudah memiliki soal,
 * atau tryout seed yang sama sudah ada,
 * script langsung dihentikan.
 *
 * TIDAK ADA DELETE DATA.
 */
async function assertSeedDoesNotExist(teacherId: string, subjectId: string) {
  const [existingQuestionCount, existingTryout] = await Promise.all([
    prisma.question.count({
      where: {
        ownerId: teacherId,
        subjectId,
      },
    }),

    prisma.tryout.findFirst({
      where: {
        ownerId: teacherId,
        subjectId,
        title: TRYOUT_TITLE,
      },

      select: {
        id: true,
        title: true,
        joinCode: true,
      },
    }),
  ]);

  if (existingQuestionCount === 0 && !existingTryout) {
    return;
  }

  const reasons: string[] = [];

  if (existingQuestionCount > 0) {
    reasons.push(
      `Bank "${SUBJECT_NAME}" sudah memiliki ${existingQuestionCount} soal.`,
    );
  }

  if (existingTryout) {
    reasons.push(
      `Tryout "${existingTryout.title}" sudah ada${
        existingTryout.joinCode
          ? ` dengan join code ${existingTryout.joinCode}`
          : ""
      }.`,
    );
  }

  throw new Error(
    [
      "",
      "SEED DIBATALKAN.",
      "",
      ...reasons,
      "",
      "Data lama TIDAK dihapus.",
      "Seed Biologi Kelas 10 hanya boleh dijalankan pada target yang masih kosong.",
    ].join("\n"),
  );
}

async function getOrCreateEmptySubject(teacherId: string) {
  const existingSubject = await findExistingSubject(teacherId);

  if (existingSubject) {
    await assertSeedDoesNotExist(teacherId, existingSubject.id);

    return existingSubject;
  }

  return prisma.subject.create({
    data: {
      ownerId: teacherId,
      name: SUBJECT_NAME,
    },
  });
}

function validateDifficultyClassification(questions: RawQuestion[]) {
  const counts: Record<DifficultyLevel, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  };

  questions.forEach((question, index) => {
    const difficulty = classifyQuestionDifficulty({
      questionText: question.questionText,
      imageAltText: null,
      hasImage: false,
    });

    if (difficulty.difficultyLevel !== question.expectedDifficulty) {
      throw new Error(
        [
          `Difficulty soal ${index + 1} tidak sesuai.`,
          `Question: ${question.questionText}`,
          `Expected: ${question.expectedDifficulty}`,
          `Actual: ${difficulty.difficultyLevel}`,
          `Score: ${difficulty.difficultyScore}`,
          `Indicators: ${difficulty.detectedIndicators.join(", ")}`,
        ].join("\n"),
      );
    }

    counts[difficulty.difficultyLevel] += 1;
  });

  if (counts.LOW !== 34 || counts.MEDIUM !== 33 || counts.HIGH !== 33) {
    throw new Error(
      `Distribusi difficulty salah. LOW=${counts.LOW}, MEDIUM=${counts.MEDIUM}, HIGH=${counts.HIGH}`,
    );
  }

  return counts;
}

function validatePriorityDistribution(questions: RawQuestion[]) {
  const counts: Record<WeightPriority, number> = {
    LOW: 0,
    NORMAL: 0,
    HIGH: 0,
    VERY_HIGH: 0,
  };

  for (const question of questions) {
    counts[question.weightPriority] += 1;
  }

  if (
    counts.LOW !== 25 ||
    counts.NORMAL !== 25 ||
    counts.HIGH !== 25 ||
    counts.VERY_HIGH !== 25
  ) {
    throw new Error(
      [
        "Distribusi WRS priority tidak rata.",
        `LOW=${counts.LOW}`,
        `NORMAL=${counts.NORMAL}`,
        `HIGH=${counts.HIGH}`,
        `VERY_HIGH=${counts.VERY_HIGH}`,
      ].join(" "),
    );
  }

  return counts;
}

function validateAnswerDistribution(questions: RawQuestion[]) {
  const counts: Record<AnswerOption, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  for (const question of questions) {
    counts[question.correctAnswer] += 1;
  }

  if (
    counts.A !== 25 ||
    counts.B !== 25 ||
    counts.C !== 25 ||
    counts.D !== 25
  ) {
    throw new Error(
      [
        "Distribusi jawaban benar tidak rata.",
        `A=${counts.A}`,
        `B=${counts.B}`,
        `C=${counts.C}`,
        `D=${counts.D}`,
      ].join(" "),
    );
  }

  return counts;
}

async function seedBiologyQuestions(
  teacherId: string,
  subjectId: string,
  questions: RawQuestion[],
) {
  for (const rawQuestion of questions) {
    const difficulty = classifyQuestionDifficulty({
      questionText: rawQuestion.questionText,

      imageAltText: null,

      hasImage: false,
    });

    const weight = getWeightFromPriority(rawQuestion.weightPriority);

    await prisma.question.create({
      data: {
        subjectId,
        ownerId: teacherId,

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
}

async function createTryout(teacherId: string, subjectId: string) {
  /**
   * Proteksi kedua.
   *
   * Walaupun sebelumnya sudah dicek,
   * kita tetap pastikan tryout belum muncul
   * sebelum melakukan create.
   */
  const existingTryout = await prisma.tryout.findFirst({
    where: {
      ownerId: teacherId,
      subjectId,
      title: TRYOUT_TITLE,
    },

    select: {
      id: true,
    },
  });

  if (existingTryout) {
    throw new Error(`Tryout "${TRYOUT_TITLE}" sudah ada. Seed dibatalkan.`);
  }

  const joinCode = await generateUniqueJoinCode();

  return prisma.tryout.create({
    data: {
      subjectId,
      ownerId: teacherId,

      title: TRYOUT_TITLE,

      totalQuestions: TRYOUT_TOTAL_QUESTIONS,

      durationMinutes: TRYOUT_DURATION_MINUTES,

      maxAttempts: TRYOUT_MAX_ATTEMPTS,

      status: TRYOUT_STATUS,

      joinCode,

      joinCodeEnabled: true,
    },
  });
}

async function printDatabaseDistribution(teacherId: string, subjectId: string) {
  const difficultyDistribution = await prisma.question.groupBy({
    by: ["difficultyLevel"],

    where: {
      ownerId: teacherId,
      subjectId,
    },

    _count: {
      difficultyLevel: true,
    },
  });

  const priorityDistribution = await prisma.question.groupBy({
    by: ["weightPriority"],

    where: {
      ownerId: teacherId,
      subjectId,
    },

    _count: {
      weightPriority: true,
    },
  });

  const answerDistribution = await prisma.question.groupBy({
    by: ["correctAnswer"],

    where: {
      ownerId: teacherId,
      subjectId,
    },

    _count: {
      correctAnswer: true,
    },
  });

  console.log("");

  console.log("Database difficulty distribution:");

  console.table(difficultyDistribution);

  console.log("");

  console.log("Database WRS priority distribution:");

  console.table(priorityDistribution);

  console.log("");

  console.log("Database answer distribution:");

  console.table(answerDistribution);
}

async function main() {
  console.log("Starting Biologi Kelas 10 seed...");

  console.log("");

  /**
   * Validasi source code dulu.
   */
  assertQuestionCounts();

  /**
   * Ambil teacher.
   */
  const teacher = await getTeacher();

  console.log(`Teacher: ${teacher.name}`);

  console.log(`Email: ${teacher.email}`);

  /**
   * PENTING:
   *
   * Kalau subject sudah ada dan sudah
   * mempunyai soal / tryout seed,
   * fungsi ini langsung throw Error.
   *
   * Tidak ada data yang dihapus.
   */
  const subject = await getOrCreateEmptySubject(teacher.id);

  console.log(`Bank soal: ${subject.name}`);

  /**
   * Build + validate 100 soal.
   */
  const questions = buildQuestions(biologySources);

  const difficultyCounts = validateDifficultyClassification(questions);

  const priorityCounts = validatePriorityDistribution(questions);

  const answerCounts = validateAnswerDistribution(questions);

  console.log("");

  console.log("Validated difficulty:");

  console.table(difficultyCounts);

  console.log("");

  console.log("Validated WRS priority:");

  console.table(priorityCounts);

  console.log("");

  console.log("Validated correct answer:");

  console.table(answerCounts);

  /**
   * Final guard sebelum write.
   *
   * Berguna kalau ada kemungkinan data
   * berubah antara pengecekan awal dan
   * proses insert.
   */
  await assertSeedDoesNotExist(teacher.id, subject.id);

  console.log("");

  console.log("Target database masih kosong.");

  console.log("Creating 100 questions...");

  await seedBiologyQuestions(teacher.id, subject.id, questions);

  console.log("Creating tryout...");

  const tryout = await createTryout(teacher.id, subject.id);

  const questionCount = await prisma.question.count({
    where: {
      ownerId: teacher.id,
      subjectId: subject.id,
    },
  });

  console.log("");

  console.log("Seed completed.");

  console.log("------------------------------");

  console.log(`Teacher   : ${teacher.name}`);

  console.log(`Bank      : ${subject.name}`);

  console.log(`Questions : ${questionCount}`);

  console.log(`Tryout    : ${tryout.title}`);

  console.log(`Join Code : ${tryout.joinCode}`);

  console.log(`Questions : ${tryout.totalQuestions}`);

  console.log(`Duration  : ${tryout.durationMinutes} minutes`);

  console.log(`Attempts  : ${tryout.maxAttempts ?? "Unlimited"}`);

  console.log("------------------------------");

  await printDatabaseDistribution(teacher.id, subject.id);
}

main()
  .catch((error) => {
    console.error("");

    console.error("Failed to seed Biologi Kelas 10:", error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
