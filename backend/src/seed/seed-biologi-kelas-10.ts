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

const TEACHER_EMAIL = "RahmaHakim@test.com";

const SUBJECT_NAME = "Biologi Kelas 10";

const TRYOUT_TITLE = "Tryout Biologi Kelas 10";

const TRYOUT_TOTAL_QUESTIONS = 15;

const TRYOUT_DURATION_MINUTES = 45;

const TRYOUT_MAX_ATTEMPTS = 3;

const TRYOUT_STATUS: TryoutStatus = "OPEN";

const RESET_EXISTING_DATA = true;

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const JOIN_CODE_LENGTH = 6;

const MAX_JOIN_CODE_ATTEMPTS = 30;

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

const biologySources: QuestionSource[] = [
  // ============================================================
  // VIRUS
  // ============================================================

  // 1 - LOW
  {
    text: "Apa maksud virus sebagai parasit intraseluler obligat?",
    correct: "Virus hanya dapat berkembang biak di dalam sel inang",
    distractors: [
      "Virus dapat hidup bebas tanpa sel inang",
      "Virus hanya hidup pada benda mati",
      "Virus dapat membuat makanan sendiri",
    ],
    weightPriority: "LOW",
  },

  // 2 - MEDIUM
  {
    text: "Jelaskan mengapa virus disebut aseluler.",
    correct: "Virus tidak memiliki struktur sel yang lengkap",
    distractors: [
      "Virus tersusun dari banyak sel",
      "Virus memiliki jaringan dan organ",
      "Virus memiliki inti sel yang lengkap",
    ],
    weightPriority: "NORMAL",
  },

  // 3 - HIGH
  {
    text: "Analisis sifat virus yang dapat dikristalkan di luar sel tetapi berkembang biak di dalam sel hidup, lalu simpulkan sifat virus tersebut.",
    correct:
      "Virus memiliki ciri benda mati dan juga memiliki ciri makhluk hidup",
    distractors: [
      "Virus sama seperti bakteri",
      "Virus hanya termasuk benda mati",
      "Virus termasuk organisme bersel satu",
    ],
    weightPriority: "HIGH",
  },

  // 4 - LOW
  {
    text: "Apa fungsi kapsid pada virus?",
    correct: "Melindungi materi genetik virus",
    distractors: [
      "Menghasilkan energi bagi virus",
      "Melakukan fotosintesis",
      "Membentuk jaringan tubuh",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 5 - MEDIUM
  {
    text: "Bedakan virus DNA dan virus RNA berdasarkan materi genetiknya.",
    correct: "Virus DNA memiliki DNA, sedangkan virus RNA memiliki RNA",
    distractors: [
      "Virus DNA tidak memiliki materi genetik",
      "Virus RNA selalu memiliki DNA dan RNA",
      "Semua virus memiliki DNA dan RNA sekaligus",
    ],
    weightPriority: "LOW",
  },

  // 6 - HIGH
  {
    text: "Analisis keadaan ketika sel bakteri pecah setelah banyak virus baru terbentuk, lalu simpulkan jenis daur virus yang terjadi.",
    correct: "Daur litik",
    distractors: ["Daur lisogenik", "Pembelahan biner", "Konjugasi"],
    weightPriority: "NORMAL",
  },

  // 7 - LOW
  {
    text: "Apa fungsi serabut ekor pada bakteriofag?",
    correct: "Membantu virus menempel pada sel inang",
    distractors: [
      "Menyimpan materi genetik",
      "Membentuk kapsid",
      "Menghasilkan antibodi",
    ],
    weightPriority: "HIGH",
  },

  // 8 - MEDIUM
  {
    text: "Jelaskan apa yang terjadi pada tahap adsorpsi bakteriofag.",
    correct: "Virus menempel pada permukaan sel inang",
    distractors: [
      "Virus keluar dari sel inang",
      "Virus membentuk virus baru",
      "Virus menghancurkan antibodi",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 9 - HIGH
  {
    text: "Analisis keadaan ketika DNA virus bergabung dengan DNA bakteri tanpa langsung merusak sel bakteri, lalu simpulkan nama bentuk DNA virus tersebut.",
    correct: "Profage",
    distractors: ["Kapsomer", "Antigen", "Klorofil"],
    weightPriority: "LOW",
  },

  // 10 - LOW
  {
    text: "Apa virus yang menyebabkan penyakit demam berdarah?",
    correct: "Dengue virus",
    distractors: ["Tobacco Mosaic Virus", "Rhizobium", "Nitrobacter"],
    weightPriority: "NORMAL",
  },

  // 11 - MEDIUM
  {
    text: "Jelaskan cara vaksin membantu tubuh melawan penyakit akibat virus.",
    correct:
      "Vaksin membantu tubuh membentuk kekebalan terhadap penyakit tertentu",
    distractors: [
      "Vaksin mengubah virus menjadi bakteri",
      "Vaksin menggantikan semua sel darah putih",
      "Vaksin menghentikan seluruh kerja sel tubuh",
    ],
    weightPriority: "HIGH",
  },

  // 12 - HIGH
  {
    text: "Analisis penularan virus melalui percikan batuk atau bersin, lalu simpulkan cara yang tepat untuk mengurangi penularannya.",
    correct:
      "Menjaga kebersihan dan mengurangi kontak dengan percikan dari orang sakit",
    distractors: [
      "Berbagi alat makan dengan orang sakit",
      "Tidak perlu mencuci tangan",
      "Berkumpul di tempat yang penuh orang",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 13 - LOW
  {
    text: "Apa nama penyakit yang dapat dicegah dengan vaksin polio?",
    correct: "Polio",
    distractors: ["Malaria", "Tuberkulosis", "Tifus"],
    weightPriority: "LOW",
  },

  // 14 - MEDIUM
  {
    text: "Tentukan penyakit yang disebabkan oleh Human Immunodeficiency Virus.",
    correct: "AIDS",
    distractors: ["Influenza", "Kolera", "Tetanus"],
    weightPriority: "NORMAL",
  },

  // 15 - HIGH
  {
    text: "Analisis beberapa cara penularan HIV, lalu simpulkan kegiatan yang tidak dapat menularkan HIV.",
    correct: "Berjabat tangan",
    distractors: [
      "Berbagi jarum suntik",
      "Menerima darah yang terkontaminasi HIV",
      "Penularan dari ibu kepada bayi",
    ],
    weightPriority: "HIGH",
  },

  // 16 - LOW
  {
    text: "Apa virus yang menyerang tanaman tembakau?",
    correct: "Tobacco Mosaic Virus",
    distractors: ["Dengue virus", "Rabies virus", "Morbilli virus"],
    weightPriority: "VERY_HIGH",
  },

  // 17 - MEDIUM
  {
    text: "Jelaskan dampak Tobacco Mosaic Virus pada tanaman tembakau.",
    correct:
      "Daun mengalami bercak seperti mosaik dan pertumbuhan tanaman terganggu",
    distractors: [
      "Tanaman menghasilkan buah lebih banyak",
      "Akar tanaman berubah menjadi batang",
      "Tanaman kehilangan semua DNA",
    ],
    weightPriority: "LOW",
  },

  // 18 - HIGH
  {
    text: "Analisis kasus seseorang yang digigit hewan terkena rabies, lalu simpulkan tindakan pencegahan yang dapat dilakukan.",
    correct: "Mendapatkan vaksin antirabies",
    distractors: [
      "Memberikan pupuk nitrogen",
      "Menggunakan antibiotik untuk semua virus",
      "Mengurangi terkena sinar matahari",
    ],
    weightPriority: "NORMAL",
  },

  // 19 - LOW
  {
    text: "Apa pengertian antigen?",
    correct: "Zat yang dapat memicu respons kekebalan tubuh",
    distractors: [
      "Zat yang selalu menghancurkan antibodi",
      "Bagian tumbuhan untuk fotosintesis",
      "Mineral yang membentuk tanah",
    ],
    weightPriority: "HIGH",
  },

  // 20 - MEDIUM
  {
    text: "Jelaskan respons tubuh setelah vaksin berhasil bekerja.",
    correct: "Tubuh membentuk antibodi dan sel memori",
    distractors: [
      "Tubuh kehilangan sistem kekebalan",
      "Tubuh kehilangan semua sel darah",
      "Tubuh langsung kebal terhadap semua penyakit",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 21 - HIGH
  {
    text: "Analisis proses pembuatan vaksin mulai dari memilih bagian virus sampai dilakukan uji klinis, lalu simpulkan tujuan akhirnya.",
    correct:
      "Menghasilkan vaksin yang aman dan dapat membantu tubuh membentuk kekebalan",
    distractors: [
      "Membuat bakteri baru untuk mengganti virus",
      "Menghilangkan DNA manusia",
      "Menghilangkan semua virus dari alam",
    ],
    weightPriority: "LOW",
  },

  // 22 - LOW
  {
    text: "Apa fungsi PCR dalam salah satu proses pembuatan vaksin?",
    correct: "Memperbanyak gen target",
    distractors: [
      "Menghancurkan antibodi",
      "Menghasilkan jaringan hewan",
      "Mengubah virus menjadi jamur",
    ],
    weightPriority: "NORMAL",
  },

  // 23 - MEDIUM
  {
    text: "Jelaskan mengapa vaksin perlu diuji sebelum digunakan banyak orang.",
    correct:
      "Untuk memastikan keamanan dan melihat respons tubuh terhadap vaksin",
    distractors: [
      "Agar vaksin berubah menjadi antibiotik",
      "Agar vaksin tidak perlu diperiksa",
      "Agar satu vaksin dapat menyembuhkan semua penyakit",
    ],
    weightPriority: "HIGH",
  },

  // 24 - HIGH
  {
    text: "Analisis penggunaan virus yang sudah dilemahkan dalam vaksin, lalu simpulkan mengapa virus tersebut dapat membantu mencegah penyakit.",
    correct:
      "Virus yang dilemahkan dapat membantu tubuh mengenali virus dan membentuk kekebalan",
    distractors: [
      "Virus yang dilemahkan berubah menjadi bakteri",
      "Tubuh tidak memberikan respons terhadap vaksin",
      "Vaksin bekerja dengan menghancurkan semua sel tubuh",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 25 - LOW
  {
    text: "Apa nama virus yang menyerang bakteri?",
    correct: "Bakteriofag",
    distractors: ["Protozoa", "Rhizobium", "Jamur"],
    weightPriority: "LOW",
  },

  // ============================================================
  // KEANEKARAGAMAN HAYATI DAN KLASIFIKASI
  // ============================================================

  // 26 - MEDIUM
  {
    text: "Bedakan keanekaragaman tingkat gen dan tingkat jenis.",
    correct:
      "Keanekaragaman gen terjadi dalam satu spesies, sedangkan keanekaragaman jenis terjadi antarspesies",
    distractors: [
      "Keduanya hanya terjadi pada benda mati",
      "Keanekaragaman gen terjadi antar kingdom",
      "Keanekaragaman jenis hanya terjadi pada satu individu",
    ],
    weightPriority: "NORMAL",
  },

  // 27 - HIGH
  {
    text: "Analisis beberapa jenis mangga yang masih termasuk satu spesies, lalu simpulkan tingkat keanekaragaman yang terjadi.",
    correct: "Keanekaragaman tingkat gen",
    distractors: [
      "Keanekaragaman tingkat ekosistem",
      "Keanekaragaman tingkat kingdom",
      "Keanekaragaman tingkat bioma",
    ],
    weightPriority: "HIGH",
  },

  // 28 - LOW
  {
    text: "Apa pengertian keanekaragaman hayati?",
    correct: "Beragamnya makhluk hidup yang ada di bumi",
    distractors: [
      "Samanya semua makhluk hidup",
      "Jumlah benda mati di suatu tempat",
      "Perubahan cuaca setiap hari",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 29 - MEDIUM
  {
    text: "Jelaskan penyebab adanya keanekaragaman hayati.",
    correct: "Perbedaan gen dan pengaruh lingkungan",
    distractors: [
      "Hanya karena makanan",
      "Hanya karena ukuran tubuh",
      "Hanya karena warna tanah",
    ],
    weightPriority: "LOW",
  },

  // 30 - HIGH
  {
    text: "Analisis dua kelompok organisme yang memiliki banyak perbedaan dan tidak dapat menghasilkan keturunan yang subur, lalu simpulkan tingkat keanekaragamannya.",
    correct: "Keanekaragaman tingkat jenis",
    distractors: [
      "Keanekaragaman tingkat gen",
      "Keanekaragaman tingkat molekul",
      "Keanekaragaman tingkat organ",
    ],
    weightPriority: "NORMAL",
  },

  // 31 - LOW
  {
    text: "Apa contoh keanekaragaman tingkat gen?",
    correct: "Berbagai varietas mangga",
    distractors: [
      "Gurun dan hutan hujan tropis",
      "Singa dan harimau",
      "Laut dan sawah",
    ],
    weightPriority: "HIGH",
  },

  // 32 - MEDIUM
  {
    text: "Tentukan tingkat keanekaragaman pada hutan hujan, gurun, dan padang rumput.",
    correct: "Keanekaragaman tingkat ekosistem",
    distractors: [
      "Keanekaragaman tingkat gen",
      "Keanekaragaman tingkat sel",
      "Keanekaragaman tingkat jaringan",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 33 - HIGH
  {
    text: "Analisis penggunaan garis Wallace dan garis Weber di Indonesia, lalu simpulkan kegunaan kedua garis tersebut.",
    correct: "Membagi wilayah persebaran fauna di Indonesia",
    distractors: [
      "Membagi batas provinsi",
      "Menentukan jenis tanah",
      "Menentukan kadar garam laut",
    ],
    weightPriority: "LOW",
  },

  // 34 - LOW
  {
    text: "Apa daerah yang termasuk wilayah fauna Oriental di Indonesia?",
    correct: "Sumatra, Jawa, Bali, dan Kalimantan",
    distractors: [
      "Papua dan Australia",
      "Eropa dan Afrika",
      "Amerika dan Antarktika",
    ],
    weightPriority: "NORMAL",
  },

  // 35 - MEDIUM
  {
    text: "Jelaskan ciri fauna Indonesia bagian timur.",
    correct: "Banyak hewan berkantung dan burung yang memiliki warna menarik",
    distractors: [
      "Semua hewan berukuran sangat besar",
      "Semua hewan hidup di air",
      "Tidak ada mamalia",
    ],
    weightPriority: "HIGH",
  },

  // 36 - HIGH
  {
    text: "Analisis keadaan hewan yang kehilangan tempat hidup karena hutan berubah menjadi permukiman, lalu simpulkan ancaman yang terjadi.",
    correct: "Hilangnya habitat asli",
    distractors: [
      "Meningkatnya konservasi",
      "Bertambahnya habitat alami",
      "Bertambahnya jumlah spesies",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 37 - LOW
  {
    text: "Apa fungsi plasma nutfah?",
    correct: "Menjadi sumber sifat genetik yang dapat diwariskan",
    distractors: [
      "Menghilangkan variasi gen",
      "Menyamakan semua organisme",
      "Menggantikan fungsi ekosistem",
    ],
    weightPriority: "LOW",
  },

  // 38 - MEDIUM
  {
    text: "Bedakan pelestarian in situ dan ex situ.",
    correct:
      "In situ dilakukan di habitat asli, sedangkan ex situ di luar habitat asli",
    distractors: [
      "In situ hanya untuk tumbuhan",
      "Keduanya hanya dilakukan di laboratorium",
      "Keduanya tidak berhubungan dengan pelestarian",
    ],
    weightPriority: "NORMAL",
  },

  // 39 - HIGH
  {
    text: "Analisis habitat hewan yang terpisah karena pembangunan jalan, lalu simpulkan cara yang tepat untuk membantu menjaga hewan tersebut.",
    correct: "Menjaga dan menghubungkan kembali habitat yang terpisah",
    distractors: [
      "Memperbanyak pembangunan di habitat",
      "Menghilangkan tumbuhan di sekitar habitat",
      "Meningkatkan perburuan",
    ],
    weightPriority: "HIGH",
  },

  // 40 - LOW
  {
    text: "Apa pengertian klasifikasi makhluk hidup?",
    correct:
      "Pengelompokan makhluk hidup berdasarkan persamaan dan perbedaan ciri",
    distractors: [
      "Menghitung semua organisme",
      "Mengubah nama organisme dengan bebas",
      "Mengukur cuaca",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 41 - MEDIUM
  {
    text: "Jelaskan manfaat klasifikasi makhluk hidup.",
    correct:
      "Memudahkan kita mempelajari makhluk hidup dan mengetahui kekerabatannya",
    distractors: [
      "Menghilangkan perbedaan organisme",
      "Membuat organisme tidak memiliki nama",
      "Mengurangi jumlah spesies",
    ],
    weightPriority: "LOW",
  },

  // 42 - HIGH
  {
    text: "Analisis penggunaan bentuk tubuh, bagian dalam tubuh, dan ciri kimia dalam klasifikasi, lalu simpulkan manfaat memakai banyak ciri.",
    correct: "Pengelompokan organisme menjadi lebih tepat",
    distractors: [
      "Semua organisme masuk satu kelompok",
      "Ciri organisme tidak perlu diamati",
      "Nama ilmiah tidak lagi diperlukan",
    ],
    weightPriority: "NORMAL",
  },

  // 43 - LOW
  {
    text: "Apa aturan penulisan kata pertama pada nama ilmiah?",
    correct: "Menunjukkan genus dan diawali huruf kapital",
    distractors: [
      "Menunjukkan spesies dan diawali huruf kecil",
      "Menunjukkan famili dan ditulis dengan angka",
      "Menunjukkan kingdom dan terdiri dari tiga kata",
    ],
    weightPriority: "HIGH",
  },

  // 44 - MEDIUM
  {
    text: "Tentukan penulisan nama ilmiah manusia yang benar.",
    correct: "Homo sapiens",
    distractors: ["homo Sapiens", "HOMO SAPIENS", "Homo Sapiens"],
    weightPriority: "VERY_HIGH",
  },

  // 45 - HIGH
  {
    text: "Analisis dua organisme yang memiliki genus sama tetapi spesies berbeda, lalu simpulkan tingkat kekerabatannya.",
    correct: "Keduanya memiliki kekerabatan yang cukup dekat",
    distractors: [
      "Keduanya tidak memiliki persamaan",
      "Keduanya pasti satu spesies",
      "Genus tidak berhubungan dengan kekerabatan",
    ],
    weightPriority: "LOW",
  },

  // 46 - LOW
  {
    text: "Apa pengertian kunci determinasi?",
    correct: "Petunjuk untuk mengenali organisme berdasarkan ciri-cirinya",
    distractors: ["Daftar nilai ujian", "Tabel cuaca", "Diagram aliran energi"],
    weightPriority: "NORMAL",
  },

  // 47 - MEDIUM
  {
    text: "Jelaskan cara kerja kunci determinasi dikotom.",
    correct: "Setiap tahap memberikan dua pilihan ciri yang berbeda",
    distractors: [
      "Setiap tahap hanya memiliki satu pilihan",
      "Semua organisme harus memiliki ciri sama",
      "Tidak perlu melihat ciri organisme",
    ],
    weightPriority: "HIGH",
  },

  // 48 - HIGH
  {
    text: "Analisis hewan yang tidak bertulang belakang, memiliki sayap, dan mulut menggigit, lalu simpulkan hewan yang sesuai.",
    correct: "Belalang",
    distractors: ["Ikan", "Sapi", "Anjing"],
    weightPriority: "VERY_HIGH",
  },

  // 49 - LOW
  {
    text: "Apa pengertian kladogram?",
    correct: "Diagram yang menunjukkan hubungan kekerabatan organisme",
    distractors: [
      "Diagram curah hujan",
      "Tabel jumlah penduduk",
      "Grafik suhu tubuh",
    ],
    weightPriority: "LOW",
  },

  // 50 - MEDIUM
  {
    text: "Jelaskan kegunaan kladogram.",
    correct: "Membantu melihat kedekatan kekerabatan antarorganisme",
    distractors: [
      "Hanya menunjukkan ukuran tubuh",
      "Menghilangkan informasi ciri",
      "Hanya digunakan untuk benda mati",
    ],
    weightPriority: "NORMAL",
  },

  // ============================================================
  // EKOSISTEM DAN INTERAKSINYA
  // ============================================================

  // 51 - HIGH
  {
    text: "Analisis perubahan suhu dan kelembapan di suatu tempat, lalu simpulkan pengaruhnya terhadap organisme yang hidup di sana.",
    correct:
      "Jenis dan jumlah organisme dapat berubah karena kebutuhan lingkungannya berbeda",
    distractors: [
      "Semua organisme tetap hidup dengan kondisi yang sama",
      "Suhu tidak memengaruhi organisme",
      "Kelembapan hanya memengaruhi batu",
    ],
    weightPriority: "HIGH",
  },

  // 52 - LOW
  {
    text: "Apa pengertian ekosistem?",
    correct: "Hubungan antara makhluk hidup dan lingkungannya",
    distractors: [
      "Kumpulan satu jenis sel",
      "Daftar nama organisme",
      "Tempat tanpa makhluk hidup",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 53 - MEDIUM
  {
    text: "Jelaskan peran produsen dalam ekosistem.",
    correct:
      "Produsen membuat makanan yang menjadi sumber energi bagi organisme lain",
    distractors: [
      "Produsen hanya menguraikan bangkai",
      "Produsen selalu memakan konsumen",
      "Produsen tidak berhubungan dengan sumber makanan",
    ],
    weightPriority: "LOW",
  },

  // 54 - HIGH
  {
    text: "Analisis keadaan ketika jumlah tumbuhan dalam suatu ekosistem berkurang, lalu simpulkan dampaknya terhadap hewan pemakan tumbuhan.",
    correct: "Makanan bagi hewan pemakan tumbuhan akan berkurang",
    distractors: [
      "Jumlah hewan selalu bertambah",
      "Hewan tidak membutuhkan tumbuhan",
      "Tumbuhan hanya memengaruhi pengurai",
    ],
    weightPriority: "NORMAL",
  },

  // 55 - LOW
  {
    text: "Apa contoh komponen abiotik?",
    correct: "Suhu",
    distractors: ["Belalang", "Jamur", "Rumput"],
    weightPriority: "HIGH",
  },

  // 56 - MEDIUM
  {
    text: "Bedakan dekomposer dan detritivor.",
    correct:
      "Dekomposer menguraikan sisa makhluk hidup, sedangkan detritivor memakan sisa makhluk hidup",
    distractors: [
      "Keduanya merupakan produsen",
      "Detritivor membuat makanan sendiri",
      "Dekomposer hanya memakan organisme hidup",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 57 - HIGH
  {
    text: "Analisis keadaan ekosistem tanpa organisme pengurai, lalu simpulkan akibat yang mungkin terjadi.",
    correct:
      "Sisa makhluk hidup akan menumpuk dan unsur hara sulit kembali ke lingkungan",
    distractors: [
      "Unsur hara terus bertambah tanpa batas",
      "Tumbuhan tidak membutuhkan unsur hara",
      "Sisa organisme langsung hilang",
    ],
    weightPriority: "LOW",
  },

  // 58 - LOW
  {
    text: "Apa pengertian niche atau relung?",
    correct: "Peran suatu organisme di dalam ekosistem",
    distractors: [
      "Nama ilmiah organisme",
      "Jumlah organisme di bumi",
      "Ukuran tubuh organisme",
    ],
    weightPriority: "NORMAL",
  },

  // 59 - MEDIUM
  {
    text: "Jelaskan kompetisi interspesifik.",
    correct: "Persaingan antara organisme dari spesies yang berbeda",
    distractors: [
      "Persaingan dalam satu individu",
      "Interaksi yang selalu saling menguntungkan",
      "Interaksi antara organisme dan benda mati",
    ],
    weightPriority: "HIGH",
  },

  // 60 - HIGH
  {
    text: "Analisis pohon pinus yang menghambat pertumbuhan tanaman lain di sekitarnya, lalu simpulkan jenis interaksi yang terjadi.",
    correct: "Amensalisme",
    distractors: ["Mutualisme", "Komensalisme", "Netralisme"],
    weightPriority: "VERY_HIGH",
  },

  // 61 - LOW
  {
    text: "Apa contoh hubungan mutualisme?",
    correct: "Lebah dan bunga",
    distractors: [
      "Ular dan tikus",
      "Tali putri dan tanaman inang",
      "Pinus dan tanaman yang dihambatnya",
    ],
    weightPriority: "LOW",
  },

  // 62 - MEDIUM
  {
    text: "Jelaskan hubungan ikan remora dan paus.",
    correct:
      "Remora mendapat keuntungan, sedangkan paus tidak dirugikan atau diuntungkan",
    distractors: [
      "Keduanya saling dirugikan",
      "Paus dimakan oleh remora",
      "Remora tidak mendapat keuntungan",
    ],
    weightPriority: "NORMAL",
  },

  // 63 - HIGH
  {
    text: "Analisis keadaan ketika predator utama hilang dari suatu ekosistem, lalu simpulkan dampaknya terhadap jumlah mangsa.",
    correct: "Jumlah mangsa dapat meningkat",
    distractors: [
      "Mangsa langsung punah",
      "Mangsa tidak dipengaruhi predator",
      "Produsen berhenti fotosintesis",
    ],
    weightPriority: "HIGH",
  },

  // 64 - LOW
  {
    text: "Apa pengertian rantai makanan?",
    correct: "Urutan makan dan dimakan yang menunjukkan perpindahan energi",
    distractors: [
      "Urutan klasifikasi organisme",
      "Daftar komponen abiotik",
      "Urutan terbentuknya tanah",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 65 - MEDIUM
  {
    text: "Bedakan rantai makanan dan jaring-jaring makanan.",
    correct:
      "Jaring-jaring makanan terdiri dari beberapa rantai makanan yang saling berhubungan",
    distractors: [
      "Rantai makanan selalu lebih rumit",
      "Jaring-jaring makanan tidak menunjukkan makan dan dimakan",
      "Keduanya tidak berhubungan dengan energi",
    ],
    weightPriority: "LOW",
  },

  // 66 - HIGH
  {
    text: "Analisis perpindahan energi dari tumbuhan ke beberapa tingkat konsumen, lalu simpulkan mengapa energi semakin berkurang.",
    correct:
      "Sebagian energi digunakan organisme untuk hidup dan sebagian hilang sebagai panas",
    distractors: [
      "Energi selalu bertambah",
      "Semua energi disimpan",
      "Konsumen dapat membuat energi baru",
    ],
    weightPriority: "NORMAL",
  },

  // 67 - LOW
  {
    text: "Apa pengertian piramida ekologi?",
    correct: "Gambaran perbandingan tingkat trofik dalam ekosistem",
    distractors: [
      "Diagram klasifikasi kingdom",
      "Grafik pembelahan bakteri",
      "Peta wilayah kota",
    ],
    weightPriority: "HIGH",
  },

  // 68 - MEDIUM
  {
    text: "Bedakan piramida jumlah, biomassa, dan energi.",
    correct:
      "Ketiganya membandingkan jumlah organisme, massa organisme, dan energi",
    distractors: [
      "Ketiganya hanya membandingkan suhu",
      "Piramida energi menunjukkan jumlah gen",
      "Piramida biomassa hanya untuk benda mati",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 69 - HIGH
  {
    text: "Analisis piramida energi dalam ekosistem, lalu simpulkan mengapa bentuknya tidak terbalik.",
    correct: "Energi berkurang setiap berpindah ke tingkat trofik berikutnya",
    distractors: [
      "Energi semakin banyak di tingkat atas",
      "Semua tingkat memiliki energi yang sama",
      "Produsen memiliki energi paling sedikit",
    ],
    weightPriority: "LOW",
  },

  // 70 - LOW
  {
    text: "Apa pengertian produktivitas primer?",
    correct: "Kemampuan produsen menghasilkan bahan organik",
    distractors: [
      "Kecepatan hewan memangsa tumbuhan",
      "Jumlah semua hewan",
      "Kecepatan terbentuknya batu",
    ],
    weightPriority: "NORMAL",
  },

  // 71 - MEDIUM
  {
    text: "Bedakan produktivitas primer kotor dan produktivitas primer bersih.",
    correct:
      "Produktivitas primer bersih adalah produktivitas primer kotor setelah dikurangi energi untuk respirasi",
    distractors: [
      "Produktivitas primer kotor selalu lebih kecil",
      "Keduanya tidak berhubungan dengan tumbuhan",
      "Produktivitas primer bersih hanya dimiliki hewan",
    ],
    weightPriority: "HIGH",
  },

  // 72 - HIGH
  {
    text: "Analisis penggunaan bahan bakar fosil yang semakin banyak, lalu simpulkan dampaknya terhadap karbon dioksida di udara.",
    correct: "Jumlah karbon dioksida di udara dapat meningkat",
    distractors: [
      "Karbon dioksida langsung hilang",
      "Respirasi semua organisme berhenti",
      "Karbon tidak berpindah di alam",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 73 - LOW
  {
    text: "Apa bentuk nitrogen yang dapat diserap tumbuhan dari tanah?",
    correct: "Nitrat",
    distractors: ["Protein hewani", "Karbon dioksida", "Glukosa"],
    weightPriority: "LOW",
  },

  // 74 - MEDIUM
  {
    text: "Jelaskan perubahan amonia menjadi nitrit kemudian menjadi nitrat.",
    correct: "Proses tersebut merupakan bagian dari nitrifikasi",
    distractors: [
      "Nitrat langsung berubah menjadi oksigen",
      "Amonia hanya berubah menjadi karbon",
      "Nitrit tidak terlibat dalam daur nitrogen",
    ],
    weightPriority: "NORMAL",
  },

  // 75 - HIGH
  {
    text: "Analisis daerah yang kehilangan banyak tumbuhan, lalu simpulkan pengaruhnya terhadap air yang masuk ke tanah dan air yang mengalir di permukaan.",
    correct:
      "Air yang masuk ke tanah berkurang dan aliran di permukaan dapat meningkat",
    distractors: [
      "Air yang masuk ke tanah selalu meningkat",
      "Air di permukaan langsung berhenti",
      "Tumbuhan tidak memengaruhi pergerakan air",
    ],
    weightPriority: "HIGH",
  },

  // ============================================================
  // PERUBAHAN LINGKUNGAN
  // ============================================================

  // 76 - LOW
  {
    text: "Apa pengertian polutan?",
    correct: "Bahan yang dapat menyebabkan pencemaran lingkungan",
    distractors: [
      "Semua zat yang bermanfaat",
      "Semua organisme produsen",
      "Bahan yang hanya ada di laboratorium",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 77 - MEDIUM
  {
    text: "Bedakan perubahan lingkungan karena faktor alami dan faktor manusia.",
    correct:
      "Faktor alami berasal dari kejadian alam, sedangkan faktor manusia berasal dari kegiatan manusia",
    distractors: [
      "Keduanya selalu berasal dari pabrik",
      "Faktor alami hanya terjadi di kota",
      "Faktor manusia tidak melibatkan manusia",
    ],
    weightPriority: "LOW",
  },

  // 78 - HIGH
  {
    text: "Analisis penebangan hutan dan pertambangan yang dilakukan berlebihan, lalu simpulkan dampaknya terhadap lingkungan.",
    correct: "Habitat dapat rusak dan keseimbangan lingkungan dapat terganggu",
    distractors: [
      "Keanekaragaman selalu meningkat",
      "Lingkungan selalu menjadi lebih baik",
      "Kegiatan tersebut tidak memengaruhi organisme",
    ],
    weightPriority: "NORMAL",
  },

  // 79 - LOW
  {
    text: "Apa contoh polutan biologis?",
    correct: "Bakteri Escherichia coli pada air tercemar",
    distractors: ["Cahaya matahari", "Batu kerikil", "Oksigen di udara"],
    weightPriority: "HIGH",
  },

  // 80 - MEDIUM
  {
    text: "Bedakan polutan fisik dan polutan kimia.",
    correct:
      "Polutan fisik berasal dari faktor fisik, sedangkan polutan kimia berupa zat kimia",
    distractors: [
      "Keduanya selalu berupa bakteri",
      "Polutan kimia hanya berupa suara",
      "Polutan fisik selalu berupa gas beracun",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 81 - HIGH
  {
    text: "Analisis masuknya banyak limbah organik dan zat hara ke perairan, lalu simpulkan penyebab terjadinya eutrofikasi.",
    correct:
      "Zat hara yang berlebihan membuat tumbuhan atau alga tumbuh terlalu banyak",
    distractors: [
      "Semua alga langsung hilang",
      "Air kehilangan semua zat hara",
      "Limbah tidak memengaruhi air",
    ],
    weightPriority: "LOW",
  },

  // 82 - LOW
  {
    text: "Apa pengertian pencemaran air?",
    correct: "Masuknya bahan pencemar yang menurunkan kualitas air",
    distractors: [
      "Perubahan warna langit",
      "Bertambahnya jumlah batu",
      "Perubahan nama sungai",
    ],
    weightPriority: "NORMAL",
  },

  // 83 - MEDIUM
  {
    text: "Jelaskan mengapa plastik dan pestisida dapat mencemari tanah.",
    correct:
      "Plastik sulit terurai dan pestisida dapat masuk serta mencemari tanah",
    distractors: [
      "Plastik selalu menyuburkan tanah",
      "Pestisida selalu berubah menjadi air",
      "Keduanya langsung hilang dari lingkungan",
    ],
    weightPriority: "HIGH",
  },

  // 84 - HIGH
  {
    text: "Analisis penggunaan kendaraan bermotor dan bahan yang menghasilkan CFC, lalu simpulkan dampaknya terhadap udara dan atmosfer.",
    correct:
      "Pencemaran udara dapat meningkat dan kondisi atmosfer dapat terganggu",
    distractors: [
      "Udara selalu semakin bersih",
      "Semua nitrogen di udara hilang",
      "Daur air langsung berhenti",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 85 - LOW
  {
    text: "Apa gas yang berperan besar dalam peningkatan efek rumah kaca?",
    correct: "Karbon dioksida",
    distractors: ["Helium", "Neon", "Argon"],
    weightPriority: "LOW",
  },

  // 86 - MEDIUM
  {
    text: "Jelaskan bagaimana hujan asam dapat terbentuk.",
    correct:
      "Gas pencemar bereaksi dengan uap air di udara dan membentuk senyawa asam",
    distractors: [
      "Hujan asam hanya terbentuk dari oksigen",
      "Hujan asam tidak berhubungan dengan udara",
      "Gas sulfur berubah menjadi klorofil",
    ],
    weightPriority: "NORMAL",
  },

  // 87 - HIGH
  {
    text: "Analisis jumlah gas rumah kaca yang semakin meningkat, lalu simpulkan dampaknya terhadap suhu bumi.",
    correct: "Lebih banyak panas tertahan sehingga suhu bumi dapat meningkat",
    distractors: [
      "Semua panas langsung keluar",
      "Suhu bumi selalu turun",
      "Gas rumah kaca tidak memengaruhi panas",
    ],
    weightPriority: "HIGH",
  },

  // 88 - LOW
  {
    text: "Apa batas kebisingan yang disebut sebagai pencemaran suara dalam materi?",
    correct: "85 dB",
    distractors: ["20 dB", "40 dB", "200 dB"],
    weightPriority: "VERY_HIGH",
  },

  // 89 - MEDIUM
  {
    text: "Bedakan kebisingan impulsif dan kebisingan kontinu.",
    correct:
      "Impulsif terjadi singkat, sedangkan kontinu berlangsung terus dalam waktu lama",
    distractors: [
      "Keduanya selalu berlangsung satu detik",
      "Kebisingan kontinu tidak menghasilkan suara",
      "Kebisingan impulsif hanya terjadi di air",
    ],
    weightPriority: "LOW",
  },

  // 90 - HIGH
  {
    text: "Analisis suara petasan, palu, kereta api, dan mesin pabrik, lalu simpulkan dasar pembagian jenis kebisingan tersebut.",
    correct: "Jenis kebisingan dibedakan dari pola dan lama suara muncul",
    distractors: [
      "Dibedakan berdasarkan warna alat",
      "Dibedakan berdasarkan jumlah tumbuhan",
      "Semua suara masuk jenis yang sama",
    ],
    weightPriority: "NORMAL",
  },

  // 91 - LOW
  {
    text: "Apa fungsi penyaringan dalam pengolahan limbah cair?",
    correct: "Memisahkan partikel besar dari air",
    distractors: [
      "Menghasilkan virus baru",
      "Mengubah semua air menjadi gas",
      "Menambah logam berat",
    ],
    weightPriority: "HIGH",
  },

  // 92 - MEDIUM
  {
    text: "Jelaskan peran mikroorganisme dalam pengolahan limbah cair.",
    correct: "Mikroorganisme membantu menguraikan bahan pencemar",
    distractors: [
      "Mikroorganisme menambah logam berat",
      "Mikroorganisme menghentikan penguraian",
      "Mikroorganisme selalu membuat limbah lebih berbahaya",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 93 - HIGH
  {
    text: "Analisis limbah cair yang mengandung logam berat, lalu simpulkan cara pengolahan yang sesuai.",
    correct:
      "Menggunakan pengolahan kimia untuk membantu memisahkan zat pencemar",
    distractors: [
      "Langsung membuang limbah ke sungai",
      "Menambahkan sampah plastik",
      "Menggunakan suara untuk membersihkan limbah",
    ],
    weightPriority: "LOW",
  },

  // 94 - LOW
  {
    text: "Apa contoh sampah organik yang dapat dibuat menjadi kompos?",
    correct: "Sisa sayuran dan daun",
    distractors: ["Baterai bekas", "Kaca", "Logam"],
    weightPriority: "NORMAL",
  },

  // 95 - MEDIUM
  {
    text: "Jelaskan manfaat membuat kompos dari sampah organik.",
    correct:
      "Sampah organik dapat diubah menjadi bahan yang berguna untuk tanah",
    distractors: [
      "Kompos mengubah sampah menjadi logam",
      "Kompos menghilangkan semua mikroorganisme",
      "Kompos hanya dapat dibuat dari kaca",
    ],
    weightPriority: "HIGH",
  },

  // 96 - HIGH
  {
    text: "Analisis sampah yang terdiri dari sisa makanan, plastik, dan bahan lain, lalu simpulkan mengapa sampah perlu dipisahkan sebelum diolah.",
    correct: "Setiap jenis sampah memiliki cara pengolahan yang berbeda",
    distractors: [
      "Semua sampah harus diolah dengan cara yang sama",
      "Jenis sampah tidak memengaruhi cara pengolahan",
      "Semua sampah dapat dibuang ke sungai",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 97 - LOW
  {
    text: "Apa pengertian daur ulang?",
    correct: "Mengolah kembali bahan bekas agar dapat digunakan lagi",
    distractors: [
      "Membuang semua sampah ke lingkungan",
      "Membakar semua sampah",
      "Membuang sampah ke sungai",
    ],
    weightPriority: "LOW",
  },

  // 98 - MEDIUM
  {
    text: "Jelaskan cara mengurangi pencemaran dari bahan bakar fosil.",
    correct:
      "Mengurangi penggunaan bahan bakar fosil dan memakai pilihan yang lebih bersih",
    distractors: [
      "Meningkatkan penggunaan batu bara",
      "Menambah jumlah kendaraan",
      "Menggunakan lebih banyak bahan bakar berpolusi",
    ],
    weightPriority: "NORMAL",
  },

  // 99 - HIGH
  {
    text: "Analisis musim kering yang berlangsung semakin lama, lalu simpulkan dampaknya terhadap air dan makhluk hidup.",
    correct:
      "Persediaan air dapat berkurang dan makhluk hidup dapat mengalami kesulitan",
    distractors: [
      "Air selalu semakin banyak",
      "Perubahan iklim tidak memengaruhi makhluk hidup",
      "Semua lingkungan menjadi sama",
    ],
    weightPriority: "HIGH",
  },

  // 100 - LOW
  {
    text: "Apa tindakan sederhana yang dapat dilakukan sebelum mengolah sampah?",
    correct: "Memisahkan sampah berdasarkan jenisnya",
    distractors: [
      "Mencampur semua sampah",
      "Membuang sampah ke sungai",
      "Membakar semua sampah di dalam ruangan",
    ],
    weightPriority: "VERY_HIGH",
  },
];

function assertQuestionCount() {
  if (biologySources.length !== 100) {
    throw new Error(
      `Total soal Biologi Kelas 10 harus 100, sekarang ${biologySources.length}.`,
    );
  }
}

function buildQuestions(sources: QuestionSource[]) {
  return sources.map((source, index): RawQuestion => {
    /*
     * Distribusi kunci:
     *
     * 1 -> A
     * 2 -> B
     * 3 -> C
     * 4 -> D
     *
     * Diulang sampai soal 100.
     *
     * A = 25
     * B = 25
     * C = 25
     * D = 25
     */
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

      weightPriority: source.weightPriority,
    };
  });
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
        "Distribusi WRS priority tidak sesuai.",
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
        "Distribusi jawaban benar tidak sesuai.",
        `A=${counts.A}`,
        `B=${counts.B}`,
        `C=${counts.C}`,
        `D=${counts.D}`,
      ].join(" "),
    );
  }

  return counts;
}

function getWrsPriorityProbability() {
  const priorities: WeightPriority[] = ["LOW", "NORMAL", "HIGH", "VERY_HIGH"];

  const prioritiesWithWeight = priorities.map((priority) => ({
    priority,

    weight: getWeightFromPriority(priority),
  }));

  const totalWeight = prioritiesWithWeight.reduce((total, item) => {
    return total + item.weight;
  }, 0);

  return prioritiesWithWeight.map((item) => ({
    priority: item.priority,

    weight: item.weight,

    baseProbability: `${((item.weight / totalWeight) * 100).toFixed(2)}%`,
  }));
}

function generateJoinCodeCandidate() {
  let code = "";

  for (let index = 0; index < JOIN_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * JOIN_CODE_ALPHABET.length);

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

  throw new Error("Gagal membuat join code unik.");
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

async function findOrCreateSubject(teacherId: string) {
  const existingSubject = await prisma.subject.findFirst({
    where: {
      ownerId: teacherId,

      name: SUBJECT_NAME,
    },
  });

  if (existingSubject) {
    return existingSubject;
  }

  return prisma.subject.create({
    data: {
      ownerId: teacherId,

      name: SUBJECT_NAME,
    },
  });
}

async function cleanupExistingData(teacherId: string, subjectId: string) {
  if (!RESET_EXISTING_DATA) {
    return;
  }

  console.log("");

  console.log("Resetting old Biologi Kelas 10 data...");

  const existingTryouts = await prisma.tryout.findMany({
    where: {
      ownerId: teacherId,

      subjectId,

      title: TRYOUT_TITLE,
    },

    select: {
      id: true,

      title: true,

      _count: {
        select: {
          sessions: true,

          enrollments: true,
        },
      },
    },
  });

  for (const tryout of existingTryouts) {
    console.log(`Deleting old tryout: ${tryout.title}`);

    console.log(`Sessions: ${tryout._count.sessions}`);

    console.log(`Enrollments: ${tryout._count.enrollments}`);

    await prisma.tryoutEnrollment.deleteMany({
      where: {
        tryoutId: tryout.id,
      },
    });

    try {
      await prisma.tryout.delete({
        where: {
          id: tryout.id,
        },
      });
    } catch (error) {
      throw new Error(
        [
          `Gagal menghapus tryout "${tryout.title}".`,

          `Tryout masih memiliki ${tryout._count.sessions} session.`,

          "Pastikan relasi Tryout -> Session dan Session -> Answer menggunakan onDelete: Cascade.",

          `Original error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ].join("\n"),
      );
    }
  }

  const deletedQuestions = await prisma.question.deleteMany({
    where: {
      ownerId: teacherId,

      subjectId,
    },
  });

  console.log(`Deleted ${existingTryouts.length} old tryout(s).`);

  console.log(`Deleted ${deletedQuestions.count} old question(s).`);
}

async function seedQuestions(
  teacherId: string,
  subjectId: string,
  questions: RawQuestion[],
) {
  for (let index = 0; index < questions.length; index += 1) {
    const rawQuestion = questions[index];

    if (!rawQuestion) {
      continue;
    }

    /*
     * Difficulty tetap dihitung
     * menggunakan classifier skripsi.
     */
    const difficulty = classifyQuestionDifficulty({
      questionText: rawQuestion.questionText,

      imageAltText: null,

      hasImage: false,
    });

    /*
     * Probability WRS berasal dari
     * weightPriority masing-masing soal.
     */
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

    if ((index + 1) % 10 === 0) {
      console.log(`Created ${index + 1}/${questions.length} questions`);
    }
  }
}

async function createTryout(teacherId: string, subjectId: string) {
  const joinCode = await generateUniqueJoinCode();

  return prisma.tryout.create({
    data: {
      subjectId,

      ownerId: teacherId,

      title: TRYOUT_TITLE,

      /*
       * Bank memiliki 100 soal.
       *
       * Setiap sesi siswa hanya
       * mengerjakan 20 soal.
       */
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

  assertQuestionCount();

  const teacher = await getTeacher();

  console.log(`Teacher: ${teacher.name}`);
  console.log(`Email: ${teacher.email}`);

  const subject = await findOrCreateSubject(teacher.id);

  console.log(`Bank soal: ${subject.name}`);

  /*
   * Hapus semua data tryout lama:
   * - answers
   * - WRS logs
   * - sessions
   * - enrollments
   * - tryout
   * - questions
   */
  console.log("");
  console.log("Cleaning old seed data...");

  await cleanupExistingData(teacher.id, subject.id);

  /*
   * Build soal.
   */
  const questions = buildQuestions(biologySources);

  /*
   * Difficulty TIDAK dipaksa distribusinya.
   *
   * Setiap soal akan diklasifikasikan otomatis
   * saat masuk database menggunakan:
   *
   * classifyQuestionDifficulty()
   */

  const priorityCounts = validatePriorityDistribution(questions);

  const answerCounts = validateAnswerDistribution(questions);

  const wrsProbability = getWrsPriorityProbability();

  console.log("");

  console.log("Validated WRS priority:");
  console.table(priorityCounts);

  console.log("");

  console.log("WRS base probability by priority:");
  console.table(wrsProbability);

  console.log("");

  console.log("Validated correct answer:");
  console.table(answerCounts);

  console.log("");
  console.log("Creating 100 Biologi questions...");

  await seedQuestions(teacher.id, subject.id, questions);

  console.log("");
  console.log("Creating Biologi tryout...");

  const tryout = await createTryout(teacher.id, subject.id);

  const questionCount = await prisma.question.count({
    where: {
      ownerId: teacher.id,
      subjectId: subject.id,
    },
  });

  console.log("");
  console.log("Biologi Kelas 10 seed completed.");

  console.log("----------------------------------------");

  console.log(`Teacher          : ${teacher.name}`);

  console.log(`Bank             : ${subject.name}`);

  console.log(`Questions        : ${questionCount}`);

  console.log(`Tryout           : ${tryout.title}`);

  console.log(`Join Code        : ${tryout.joinCode}`);

  console.log(`Questions/Session: ${tryout.totalQuestions}`);

  console.log(`Duration         : ${tryout.durationMinutes} minutes`);

  console.log(`Max Attempts     : ${tryout.maxAttempts ?? "Unlimited"}`);

  console.log("----------------------------------------");

  /*
   * Di sini tetap akan terlihat distribusi
   * difficulty aktual dari classifier.
   *
   * Tapi berapa pun hasilnya tidak akan
   * membuat seed gagal.
   */
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
