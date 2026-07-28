import "../lib/env.js";

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

const TRYOUT_TOTAL_QUESTIONS = 20;

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
    text: "Apa arti virus sebagai parasit intraseluler obligat?",
    correct:
      "Virus hanya dapat hidup dan bereplikasi dengan memanfaatkan sel inang",
    distractors: [
      "Virus selalu hidup bebas di luar sel",
      "Virus hanya hidup pada benda mati",
      "Virus dapat membuat makanan sendiri",
    ],
    weightPriority: "LOW",
  },

  // 2 - MEDIUM
  {
    text: "Jelaskan alasan virus disebut aseluler.",
    correct:
      "Virus tidak memiliki struktur sel lengkap seperti sitoplasma dan membran sel",
    distractors: [
      "Virus selalu tersusun atas banyak sel",
      "Virus memiliki jaringan dan organ",
      "Virus memiliki inti sel seperti sel eukariotik",
    ],
    weightPriority: "NORMAL",
  },

  // 3 - HIGH
  {
    text: "Analisis ciri virus yang dapat dikristalkan tetapi mampu bereplikasi di dalam sel hidup, lalu simpulkan kedudukan virus antara benda mati dan makhluk hidup.",
    correct:
      "Virus menunjukkan ciri benda mati di luar sel dan ciri hidup saat berada dalam sel inang",
    distractors: [
      "Virus sepenuhnya termasuk bakteri",
      "Virus selalu dianggap benda mati dalam semua kondisi",
      "Virus selalu dianggap organisme bersel satu",
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
    correct: "Virus DNA memiliki DNA sedangkan virus RNA memiliki RNA",
    distractors: [
      "Virus DNA tidak memiliki materi genetik",
      "Virus RNA selalu memiliki DNA dan RNA sekaligus",
      "Keduanya selalu memiliki dua jenis asam nukleat",
    ],
    weightPriority: "LOW",
  },

  // 6 - HIGH
  {
    text: "Analisis sel bakteri yang cepat pecah setelah terbentuk banyak virion baru, lalu simpulkan daur reproduksi virus yang sedang berlangsung.",
    correct: "Daur litik",
    distractors: [
      "Daur lisogenik tanpa lisis",
      "Pembelahan biner",
      "Konjugasi bakteri",
    ],
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
    text: "Jelaskan tahap adsorpsi pada daur reproduksi bakteriofag.",
    correct:
      "Virus melekat pada bagian reseptor sel inang menggunakan struktur penempel",
    distractors: [
      "Virus memecahkan sel inang dan keluar",
      "Virus merakit virion baru",
      "Virus membentuk antibodi",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 9 - HIGH
  {
    text: "Analisis DNA virus yang bergabung dengan kromosom bakteri tanpa segera menghancurkan sel inang, lalu simpulkan bentuk materi genetik virus tersebut.",
    correct: "Profage",
    distractors: ["Kapsomer", "Antigen", "Plasmid tumbuhan"],
    weightPriority: "LOW",
  },

  // 10 - LOW
  {
    text: "Apa contoh virus yang menyebabkan penyakit demam berdarah?",
    correct: "Dengue virus",
    distractors: ["Tobacco Mosaic Virus", "Rhizobium", "Nitrobacter"],
    weightPriority: "NORMAL",
  },

  // 11 - MEDIUM
  {
    text: "Jelaskan cara vaksin membantu tubuh menghadapi infeksi virus tertentu.",
    correct: "Vaksin merangsang respons imun dan pembentukan memori kekebalan",
    distractors: [
      "Vaksin membuat virus berubah menjadi bakteri",
      "Vaksin menggantikan seluruh sel darah putih",
      "Vaksin menghentikan semua aktivitas sel tubuh",
    ],
    weightPriority: "HIGH",
  },

  // 12 - HIGH
  {
    text: "Analisis penyebaran virus pernapasan melalui percikan dari penderita, lalu simpulkan tindakan pencegahan yang paling relevan untuk mengurangi penularan.",
    correct:
      "Mengurangi paparan percikan melalui perilaku hidup bersih dan perlindungan yang sesuai",
    distractors: [
      "Berbagi alat makan dengan penderita",
      "Mengabaikan kebersihan tangan",
      "Meningkatkan kerumunan di ruang tertutup",
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
    text: "Tentukan penyakit yang berkaitan dengan infeksi Human Immunodeficiency Virus.",
    correct: "AIDS",
    distractors: ["Influenza", "Kolera", "Tetanus"],
    weightPriority: "NORMAL",
  },

  // 15 - HIGH
  {
    text: "Analisis beberapa cara penularan HIV melalui darah dan cairan tubuh, lalu simpulkan perilaku yang tidak termasuk jalur penularan HIV.",
    correct: "Berjabat tangan biasa",
    distractors: [
      "Berbagi jarum suntik",
      "Transfusi darah terkontaminasi",
      "Penularan dari ibu yang terinfeksi kepada janin",
    ],
    weightPriority: "HIGH",
  },

  // 16 - LOW
  {
    text: "Apa contoh virus yang menyerang tanaman tembakau?",
    correct: "Tobacco Mosaic Virus",
    distractors: ["Dengue virus", "Rabies virus", "Morbilli virus"],
    weightPriority: "VERY_HIGH",
  },

  // 17 - MEDIUM
  {
    text: "Jelaskan dampak infeksi Tobacco Mosaic Virus pada tanaman tembakau.",
    correct:
      "Daun dapat menunjukkan bercak mosaik dan pertumbuhan tanaman terganggu",
    distractors: [
      "Tanaman menghasilkan lebih banyak buah tanpa batas",
      "Akar berubah menjadi organ hewan",
      "Tanaman kehilangan seluruh materi genetik",
    ],
    weightPriority: "LOW",
  },

  // 18 - HIGH
  {
    text: "Analisis gigitan hewan yang terinfeksi rabies sebagai sumber penularan, lalu simpulkan tindakan pencegahan khusus yang disebutkan dalam materi.",
    correct: "Pemberian vaksin antirabies",
    distractors: [
      "Pemberian pupuk nitrogen",
      "Penggunaan antibiotik untuk semua virus",
      "Mengurangi sinar matahari",
    ],
    weightPriority: "NORMAL",
  },

  // 19 - LOW
  {
    text: "Apa pengertian antigen dalam konteks pembuatan vaksin?",
    correct: "Zat yang dapat merangsang respons imun",
    distractors: [
      "Zat yang selalu menghancurkan antibodi",
      "Bagian tumbuhan untuk fotosintesis",
      "Mineral pembentuk tanah",
    ],
    weightPriority: "HIGH",
  },

  // 20 - MEDIUM
  {
    text: "Jelaskan respons tubuh setelah vaksinasi berhasil membentuk kekebalan.",
    correct:
      "Tubuh membentuk antibodi dan sel memori terhadap antigen tertentu",
    distractors: [
      "Tubuh kehilangan seluruh sistem imun",
      "Tubuh tidak lagi memiliki sel darah",
      "Tubuh selalu kebal terhadap semua penyakit tanpa pengecualian",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 21 - HIGH
  {
    text: "Analisis tahapan pembuatan vaksin yang mencakup pemetaan materi genetik, perbanyakan gen target, produksi antigen, dan uji klinis, lalu simpulkan tujuan akhir rangkaian tersebut.",
    correct:
      "Menghasilkan vaksin yang aman dan mampu memicu respons imun yang diharapkan",
    distractors: [
      "Menghasilkan bakteri baru untuk menggantikan virus",
      "Menghapus seluruh materi genetik manusia",
      "Membuat semua virus kehilangan kapsid di alam",
    ],
    weightPriority: "LOW",
  },

  // 22 - LOW
  {
    text: "Apa fungsi teknik PCR pada salah satu tahap pembuatan vaksin?",
    correct: "Memperbanyak gen target",
    distractors: [
      "Menghancurkan semua antibodi",
      "Menghasilkan jaringan hewan",
      "Mengubah virus menjadi jamur",
    ],
    weightPriority: "NORMAL",
  },

  // 23 - MEDIUM
  {
    text: "Jelaskan alasan kandidat vaksin perlu melalui uji klinis sebelum digunakan secara luas.",
    correct: "Untuk menilai keamanan, dosis, dan respons yang ditimbulkan",
    distractors: [
      "Agar vaksin dapat berubah menjadi antibiotik",
      "Agar tidak perlu dinilai oleh lembaga pengawas",
      "Agar semua penyakit dapat disembuhkan oleh satu vaksin",
    ],
    weightPriority: "HIGH",
  },

  // 24 - HIGH
  {
    text: "Analisis penggunaan virus yang telah dilemahkan sebagai bahan vaksin, lalu simpulkan alasan pendekatan tersebut dapat membantu pencegahan penyakit.",
    correct:
      "Virus yang dilemahkan dapat memicu pembentukan kekebalan tanpa menimbulkan penyakit seperti virus aktif",
    distractors: [
      "Virus yang dilemahkan selalu berubah menjadi bakteri",
      "Tubuh tidak memberikan respons apa pun terhadap antigen",
      "Vaksin bekerja dengan menghilangkan semua sel tubuh",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 25 - LOW
  {
    text: "Apa nama virus yang menyerang bakteri?",
    correct: "Bakteriofag",
    distractors: ["Protozoa", "Rhizobium", "Jamur saproba"],
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
      "Keanekaragaman gen hanya terjadi antar kingdom",
      "Keanekaragaman jenis hanya terjadi dalam satu individu",
    ],
    weightPriority: "NORMAL",
  },

  // 27 - HIGH
  {
    text: "Analisis beberapa varietas mangga yang masih dapat dikelompokkan dalam satu spesies, lalu simpulkan tingkat keanekaragaman yang ditunjukkan.",
    correct: "Keanekaragaman tingkat gen",
    distractors: [
      "Keanekaragaman tingkat ekosistem",
      "Keanekaragaman tingkat kingdom",
      "Keanekaragaman tingkat bioma saja",
    ],
    weightPriority: "HIGH",
  },

  // 28 - LOW
  {
    text: "Apa pengertian keanekaragaman hayati?",
    correct: "Variasi makhluk hidup pada berbagai tingkat kehidupan",
    distractors: [
      "Keseragaman seluruh makhluk hidup",
      "Jumlah benda mati di suatu tempat",
      "Perubahan cuaca harian",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 29 - MEDIUM
  {
    text: "Jelaskan faktor utama yang menyebabkan munculnya keanekaragaman hayati.",
    correct: "Variasi gen dan pengaruh lingkungan",
    distractors: [
      "Hanya jumlah makanan",
      "Hanya ukuran tubuh",
      "Hanya warna tanah",
    ],
    weightPriority: "LOW",
  },

  // 30 - HIGH
  {
    text: "Analisis dua kelompok organisme yang memiliki banyak perbedaan dan tidak menghasilkan keturunan fertil ketika dikawinkan, lalu simpulkan tingkat keanekaragaman yang lebih sesuai.",
    correct: "Keanekaragaman tingkat jenis",
    distractors: [
      "Keanekaragaman tingkat gen dalam satu spesies",
      "Keanekaragaman tingkat molekul saja",
      "Keanekaragaman tingkat organ",
    ],
    weightPriority: "NORMAL",
  },

  // 31 - LOW
  {
    text: "Apa contoh keanekaragaman tingkat gen yang disebutkan dalam materi?",
    correct: "Berbagai varietas mangga dalam satu jenis",
    distractors: [
      "Gurun dan hutan hujan tropis",
      "Singa dan harimau",
      "Laut dan sawah",
    ],
    weightPriority: "HIGH",
  },

  // 32 - MEDIUM
  {
    text: "Tentukan tingkat keanekaragaman yang tampak dari perbedaan hutan hujan tropis, gurun, dan padang rumput.",
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
    text: "Analisis pembagian fauna Indonesia menggunakan garis Wallace dan garis Weber, lalu simpulkan fungsi kedua garis tersebut.",
    correct:
      "Membantu membedakan wilayah persebaran fauna dengan karakteristik yang berbeda",
    distractors: [
      "Menentukan batas provinsi administratif",
      "Menentukan jenis tanah pertanian",
      "Menentukan kadar garam laut",
    ],
    weightPriority: "LOW",
  },

  // 34 - LOW
  {
    text: "Apa wilayah Indonesia yang termasuk kawasan fauna Oriental menurut materi?",
    correct: "Sumatra, Jawa, Bali, dan Kalimantan",
    distractors: [
      "Papua dan Australia",
      "Antarktika dan Eropa",
      "Afrika dan Amerika Selatan",
    ],
    weightPriority: "NORMAL",
  },

  // 35 - MEDIUM
  {
    text: "Jelaskan ciri umum fauna kawasan Australia yang disebutkan dalam materi.",
    correct:
      "Banyak hewan berukuran relatif kecil, terdapat mamalia berkantung, dan burung berwarna menarik",
    distractors: [
      "Didominasi mamalia sangat besar tanpa burung",
      "Semua hewan hidup di air",
      "Tidak terdapat mamalia sama sekali",
    ],
    weightPriority: "HIGH",
  },

  // 36 - HIGH
  {
    text: "Analisis spesies endemik yang kehilangan habitat akibat alih fungsi lahan, lalu simpulkan ancaman utama terhadap keanekaragaman hayati pada kasus tersebut.",
    correct: "Hilangnya habitat asli",
    distractors: [
      "Meningkatnya konservasi in situ",
      "Bertambahnya plasma nutfah",
      "Meningkatnya luas habitat alami",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 37 - LOW
  {
    text: "Apa fungsi plasma nutfah bagi kehidupan dan pemuliaan organisme?",
    correct: "Menjadi sumber sifat genetik yang dapat diwariskan",
    distractors: [
      "Menghilangkan variasi genetik",
      "Mengubah semua organisme menjadi satu jenis",
      "Menggantikan seluruh fungsi ekosistem",
    ],
    weightPriority: "LOW",
  },

  // 38 - MEDIUM
  {
    text: "Bedakan pelestarian in situ dan ex situ.",
    correct:
      "In situ dilakukan di habitat asli, sedangkan ex situ dilakukan di luar habitat asli",
    distractors: [
      "In situ hanya untuk tumbuhan dan ex situ hanya untuk hewan",
      "Keduanya selalu dilakukan di laboratorium",
      "Keduanya tidak berkaitan dengan konservasi",
    ],
    weightPriority: "NORMAL",
  },

  // 39 - HIGH
  {
    text: "Analisis fragmentasi habitat yang memisahkan populasi satwa menjadi kelompok kecil, lalu simpulkan tindakan konservasi yang paling relevan.",
    correct: "Menjaga keterhubungan habitat dan melindungi kawasan penting",
    distractors: [
      "Memperluas pembangunan yang memisahkan habitat",
      "Menghilangkan seluruh vegetasi penghubung",
      "Meningkatkan perburuan satwa",
    ],
    weightPriority: "HIGH",
  },

  // 40 - LOW
  {
    text: "Apa pengertian klasifikasi makhluk hidup?",
    correct:
      "Pengelompokan makhluk hidup berdasarkan persamaan dan perbedaan ciri",
    distractors: [
      "Penghitungan seluruh organisme tanpa pengelompokan",
      "Perubahan nama organisme secara bebas",
      "Pengukuran cuaca di suatu tempat",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 41 - MEDIUM
  {
    text: "Jelaskan manfaat klasifikasi bagi pembelajaran keanekaragaman makhluk hidup.",
    correct: "Memudahkan mempelajari organisme dan mengetahui kekerabatannya",
    distractors: [
      "Menghilangkan seluruh perbedaan organisme",
      "Membuat organisme tidak memiliki nama",
      "Mengurangi jumlah spesies di alam",
    ],
    weightPriority: "LOW",
  },

  // 42 - HIGH
  {
    text: "Analisis penggunaan ciri morfologi, anatomi, dan biokimia dalam pengelompokan organisme, lalu simpulkan manfaat penggunaan banyak ciri.",
    correct:
      "Pengelompokan dapat mencerminkan persamaan dan kekerabatan dengan lebih baik",
    distractors: [
      "Semua organisme akan masuk satu kelompok",
      "Ciri organisme menjadi tidak perlu diamati",
      "Nama ilmiah tidak lagi dibutuhkan",
    ],
    weightPriority: "NORMAL",
  },

  // 43 - LOW
  {
    text: "Apa aturan penulisan kata pertama pada sistem binomial nomenklatur?",
    correct: "Menunjukkan genus dan diawali huruf kapital",
    distractors: [
      "Menunjukkan spesies dan selalu diawali huruf kecil",
      "Menunjukkan famili dan ditulis dengan angka",
      "Menunjukkan kingdom dan harus terdiri dari tiga kata",
    ],
    weightPriority: "HIGH",
  },

  // 44 - MEDIUM
  {
    text: "Tentukan penulisan nama ilmiah yang mengikuti aturan binomial nomenklatur untuk manusia.",
    correct: "Homo sapiens",
    distractors: ["homo Sapiens", "HOMO SAPIENS", "Homo Sapiens"],
    weightPriority: "VERY_HIGH",
  },

  // 45 - HIGH
  {
    text: "Analisis dua organisme yang berada pada genus yang sama tetapi spesies berbeda, lalu simpulkan hubungan kekerabatannya dibanding organisme yang berbeda genus.",
    correct: "Keduanya cenderung memiliki kekerabatan lebih dekat",
    distractors: [
      "Keduanya pasti tidak memiliki persamaan ciri",
      "Keduanya selalu merupakan satu spesies",
      "Genus tidak berkaitan dengan kekerabatan",
    ],
    weightPriority: "LOW",
  },

  // 46 - LOW
  {
    text: "Apa pengertian kunci determinasi?",
    correct:
      "Daftar keterangan untuk menentukan kelompok organisme berdasarkan cirinya",
    distractors: [
      "Daftar nilai ujian biologi",
      "Tabel cuaca harian",
      "Diagram aliran energi",
    ],
    weightPriority: "NORMAL",
  },

  // 47 - MEDIUM
  {
    text: "Jelaskan prinsip kunci determinasi dikotom.",
    correct: "Setiap tahap menyediakan dua pilihan ciri yang berlawanan",
    distractors: [
      "Setiap tahap hanya memiliki satu pilihan",
      "Semua ciri harus sama",
      "Kunci hanya menggunakan nama ilmiah tanpa ciri",
    ],
    weightPriority: "HIGH",
  },

  // 48 - HIGH
  {
    text: "Analisis organisme yang tidak bertulang belakang, memiliki sayap, dan tipe mulut menggigit berdasarkan contoh kunci dikotom dalam materi, lalu simpulkan organisme yang sesuai.",
    correct: "Belalang",
    distractors: ["Ikan", "Sapi", "Anjing"],
    weightPriority: "VERY_HIGH",
  },

  // 49 - LOW
  {
    text: "Apa pengertian kladogram?",
    correct: "Diagram yang membantu menggambarkan kekerabatan organisme",
    distractors: [
      "Diagram untuk menghitung curah hujan",
      "Tabel jumlah penduduk",
      "Grafik suhu tubuh",
    ],
    weightPriority: "LOW",
  },

  // 50 - MEDIUM
  {
    text: "Jelaskan alasan kladogram berguna untuk memahami kekerabatan makhluk hidup.",
    correct: "Kladogram menunjukkan kedekatan berdasarkan persamaan karakter",
    distractors: [
      "Kladogram hanya menunjukkan ukuran tubuh",
      "Kladogram menghapus informasi ciri",
      "Kladogram hanya dipakai untuk benda mati",
    ],
    weightPriority: "NORMAL",
  },

  // ============================================================
  // EKOSISTEM DAN INTERAKSINYA
  // ============================================================

  // 51 - HIGH
  {
    text: "Analisis perubahan suhu dan kelembapan suatu habitat, lalu simpulkan kemungkinan pengaruhnya terhadap persebaran organisme yang hidup di sana.",
    correct:
      "Persebaran organisme dapat berubah karena setiap organisme memiliki kebutuhan lingkungan tertentu",
    distractors: [
      "Semua organisme selalu bertahan tanpa penyesuaian",
      "Faktor abiotik tidak berpengaruh pada kehidupan",
      "Suhu dan kelembapan hanya memengaruhi batuan",
    ],
    weightPriority: "HIGH",
  },

  // 52 - LOW
  {
    text: "Apa pengertian ekosistem?",
    correct: "Hubungan timbal balik antara makhluk hidup dan lingkungannya",
    distractors: [
      "Kumpulan satu jenis sel",
      "Daftar nama organisme",
      "Tempat tanpa interaksi antar komponen",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 53 - MEDIUM
  {
    text: "Jelaskan peran produsen dalam ekosistem.",
    correct:
      "Produsen membentuk bahan organik yang menjadi sumber energi bagi tingkat trofik berikutnya",
    distractors: [
      "Produsen hanya menguraikan bangkai",
      "Produsen memperoleh energi dengan memakan semua konsumen",
      "Produsen tidak berkaitan dengan sumber energi konsumen",
    ],
    weightPriority: "LOW",
  },

  // 54 - HIGH
  {
    text: "Analisis penurunan jumlah produsen dalam suatu ekosistem, lalu simpulkan dampaknya terhadap konsumen primer.",
    correct: "Sumber makanan dan energi bagi konsumen primer akan berkurang",
    distractors: [
      "Konsumen primer selalu bertambah tanpa batas",
      "Energi konsumen primer tidak bergantung pada produsen",
      "Produsen hanya memengaruhi pengurai",
    ],
    weightPriority: "NORMAL",
  },

  // 55 - LOW
  {
    text: "Apa contoh komponen abiotik dalam ekosistem?",
    correct: "Suhu",
    distractors: ["Belalang", "Jamur", "Rumput"],
    weightPriority: "HIGH",
  },

  // 56 - MEDIUM
  {
    text: "Bedakan dekomposer dan detritivor berdasarkan cara memperoleh bahan makanan.",
    correct:
      "Dekomposer menguraikan bahan organik sedangkan detritivor memakan serpihan organisme",
    distractors: [
      "Keduanya selalu merupakan produsen",
      "Detritivor membuat makanan sendiri",
      "Dekomposer hanya memakan organisme hidup",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 57 - HIGH
  {
    text: "Analisis ekosistem tanpa organisme pengurai, lalu simpulkan akibat jangka panjang terhadap daur materi.",
    correct:
      "Sisa organisme akan menumpuk dan pengembalian unsur hara ke lingkungan terganggu",
    distractors: [
      "Semua unsur hara bertambah tanpa batas",
      "Produsen tidak lagi membutuhkan unsur hara",
      "Daur materi menjadi lebih cepat tanpa pengurai",
    ],
    weightPriority: "LOW",
  },

  // 58 - LOW
  {
    text: "Apa pengertian niche atau relung organisme?",
    correct: "Posisi dan peranan fungsional organisme dalam ekosistem",
    distractors: [
      "Nama ilmiah suatu organisme",
      "Jumlah seluruh organisme di bumi",
      "Ukuran tubuh organisme",
    ],
    weightPriority: "NORMAL",
  },

  // 59 - MEDIUM
  {
    text: "Jelaskan kompetisi interspesifik dalam suatu ekosistem.",
    correct:
      "Persaingan antara individu dari spesies berbeda untuk mendapatkan sumber daya",
    distractors: [
      "Persaingan dalam satu individu",
      "Interaksi yang selalu menguntungkan kedua pihak",
      "Interaksi antara organisme dengan benda mati saja",
    ],
    weightPriority: "HIGH",
  },

  // 60 - HIGH
  {
    text: "Analisis pohon pinus yang menghasilkan senyawa penghambat pertumbuhan tanaman lain di sekitarnya, lalu simpulkan jenis interaksinya.",
    correct: "Amensalisme",
    distractors: ["Mutualisme", "Komensalisme", "Netralisme"],
    weightPriority: "VERY_HIGH",
  },

  // 61 - LOW
  {
    text: "Apa contoh mutualisme yang disebutkan dalam materi?",
    correct: "Lebah dan bunga",
    distractors: [
      "Ular dan tikus",
      "Tali putri dan tanaman inang",
      "Pinus dan tumbuhan yang dihambatnya",
    ],
    weightPriority: "LOW",
  },

  // 62 - MEDIUM
  {
    text: "Jelaskan hubungan komensalisme antara ikan remora dan paus.",
    correct:
      "Remora memperoleh keuntungan sementara paus tidak dirugikan maupun diuntungkan",
    distractors: [
      "Keduanya saling dirugikan",
      "Paus selalu dimakan oleh remora",
      "Remora tidak memperoleh manfaat apa pun",
    ],
    weightPriority: "NORMAL",
  },

  // 63 - HIGH
  {
    text: "Analisis hilangnya predator utama pada suatu ekosistem, lalu simpulkan perubahan yang mungkin terjadi pada populasi mangsa.",
    correct:
      "Populasi mangsa dapat meningkat karena tekanan pemangsaan berkurang",
    distractors: [
      "Populasi mangsa selalu langsung punah",
      "Jumlah mangsa tidak dipengaruhi predator",
      "Predator yang hilang membuat produsen berhenti fotosintesis",
    ],
    weightPriority: "HIGH",
  },

  // 64 - LOW
  {
    text: "Apa pengertian rantai makanan?",
    correct: "Jalur perpindahan energi melalui peristiwa makan dan dimakan",
    distractors: [
      "Urutan klasifikasi organisme",
      "Daftar seluruh komponen abiotik",
      "Rangkaian pembentukan tanah",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 65 - MEDIUM
  {
    text: "Bedakan jaring-jaring makanan dan rantai makanan.",
    correct:
      "Jaring-jaring makanan tersusun dari beberapa rantai makanan yang saling berhubungan",
    distractors: [
      "Rantai makanan selalu lebih kompleks",
      "Jaring-jaring makanan tidak menunjukkan aktivitas makan",
      "Keduanya tidak berkaitan dengan perpindahan energi",
    ],
    weightPriority: "LOW",
  },

  // 66 - HIGH
  {
    text: "Analisis perpindahan energi dari produsen ke beberapa tingkat konsumen, lalu simpulkan alasan energi semakin sedikit pada tingkat trofik yang lebih tinggi.",
    correct:
      "Sebagian energi digunakan untuk aktivitas hidup dan dilepaskan sebagai panas pada setiap perpindahan",
    distractors: [
      "Energi selalu bertambah pada setiap tingkat",
      "Semua energi disimpan tanpa digunakan",
      "Konsumen menciptakan energi baru",
    ],
    weightPriority: "NORMAL",
  },

  // 67 - LOW
  {
    text: "Apa pengertian piramida ekologi?",
    correct: "Gambaran perbandingan antar tingkat trofik dalam ekosistem",
    distractors: [
      "Diagram klasifikasi kingdom",
      "Grafik pembelahan bakteri",
      "Peta persebaran kota",
    ],
    weightPriority: "HIGH",
  },

  // 68 - MEDIUM
  {
    text: "Bedakan piramida jumlah, biomassa, dan energi.",
    correct:
      "Ketiganya membandingkan jumlah organisme, massa organisme, dan energi pada tingkat trofik",
    distractors: [
      "Ketiganya hanya membandingkan suhu",
      "Piramida energi mengukur jumlah gen",
      "Piramida biomassa hanya digunakan untuk benda mati",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 69 - HIGH
  {
    text: "Analisis sifat piramida energi pada ekosistem, lalu simpulkan alasan piramida energi tidak terbalik.",
    correct:
      "Energi berkurang pada setiap perpindahan ke tingkat trofik berikutnya",
    distractors: [
      "Energi selalu bertambah di tingkat atas",
      "Semua tingkat memiliki energi sama",
      "Produsen memiliki energi paling sedikit",
    ],
    weightPriority: "LOW",
  },

  // 70 - LOW
  {
    text: "Apa pengertian produktivitas primer?",
    correct: "Kecepatan produsen mengubah energi menjadi bahan organik",
    distractors: [
      "Kecepatan konsumen memangsa produsen",
      "Jumlah seluruh hewan dalam habitat",
      "Laju pembentukan batuan",
    ],
    weightPriority: "NORMAL",
  },

  // 71 - MEDIUM
  {
    text: "Bedakan produktivitas primer kotor dan produktivitas primer bersih.",
    correct:
      "Produktivitas primer bersih merupakan produktivitas primer kotor setelah dikurangi respirasi produsen",
    distractors: [
      "Produktivitas primer kotor selalu lebih kecil",
      "Keduanya tidak berkaitan dengan fotosintesis",
      "Produktivitas primer bersih hanya dimiliki hewan",
    ],
    weightPriority: "HIGH",
  },

  // 72 - HIGH
  {
    text: "Analisis peningkatan pembakaran bahan bakar fosil, lalu simpulkan pengaruhnya terhadap daur karbon di atmosfer.",
    correct: "Lebih banyak karbon dioksida dapat dilepaskan ke atmosfer",
    distractors: [
      "Karbon dioksida langsung hilang seluruhnya",
      "Pembakaran fosil menghentikan respirasi organisme",
      "Karbon tidak mengalami perpindahan antar komponen",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 73 - LOW
  {
    text: "Apa bentuk nitrogen yang diserap tumbuhan dari tanah menurut materi?",
    correct: "Nitrat",
    distractors: [
      "Nitrogen bebas tanpa perubahan",
      "Protein hewani",
      "Karbon dioksida",
    ],
    weightPriority: "LOW",
  },

  // 74 - MEDIUM
  {
    text: "Jelaskan urutan perubahan amonia menjadi nitrit dan kemudian nitrat pada daur nitrogen.",
    correct:
      "Amonia mengalami nitritasi lalu nitratasi sebagai bagian dari nitrifikasi",
    distractors: [
      "Nitrat langsung berubah menjadi oksigen",
      "Amonia hanya berubah menjadi karbon",
      "Nitrit tidak terlibat dalam daur nitrogen",
    ],
    weightPriority: "NORMAL",
  },

  // 75 - HIGH
  {
    text: "Analisis berkurangnya vegetasi pada suatu daerah, lalu simpulkan dampaknya terhadap infiltrasi air dan aliran permukaan.",
    correct:
      "Infiltrasi cenderung menurun dan aliran permukaan dapat meningkat",
    distractors: [
      "Infiltrasi selalu meningkat tanpa vegetasi",
      "Aliran permukaan selalu berhenti",
      "Vegetasi tidak berkaitan dengan pergerakan air",
    ],
    weightPriority: "HIGH",
  },

  // ============================================================
  // PERUBAHAN LINGKUNGAN
  // ============================================================

  // 76 - LOW
  {
    text: "Apa pengertian polutan?",
    correct:
      "Bahan atau komponen yang menyebabkan pencemaran ketika berada pada kondisi yang tidak sesuai",
    distractors: [
      "Semua zat yang selalu bermanfaat",
      "Organisme yang selalu menjadi produsen",
      "Bahan yang hanya terdapat di laboratorium",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 77 - MEDIUM
  {
    text: "Bedakan perubahan lingkungan akibat faktor alami dan faktor buatan.",
    correct:
      "Faktor alami berasal dari kejadian alam sedangkan faktor buatan berasal dari aktivitas manusia",
    distractors: [
      "Keduanya selalu berasal dari aktivitas industri",
      "Faktor alami hanya terjadi di kota",
      "Faktor buatan tidak melibatkan manusia",
    ],
    weightPriority: "LOW",
  },

  // 78 - HIGH
  {
    text: "Analisis penebangan hutan dan kegiatan pertambangan yang tidak terkendali, lalu simpulkan dampaknya terhadap keseimbangan lingkungan.",
    correct:
      "Kerusakan habitat dan perubahan kondisi lingkungan dapat meningkat",
    distractors: [
      "Keanekaragaman selalu meningkat",
      "Kondisi lingkungan selalu menjadi lebih stabil",
      "Aktivitas tersebut tidak memengaruhi organisme",
    ],
    weightPriority: "NORMAL",
  },

  // 79 - LOW
  {
    text: "Apa contoh polutan biologis yang disebutkan dalam materi?",
    correct: "Bakteri Escherichia coli pada air yang tercemar",
    distractors: ["Cahaya matahari", "Batu kerikil", "Oksigen normal di udara"],
    weightPriority: "HIGH",
  },

  // 80 - MEDIUM
  {
    text: "Bedakan polutan fisik dan polutan kimia berdasarkan sifat bahan pencemarnya.",
    correct:
      "Polutan fisik berkaitan dengan faktor fisik atau material tertentu, sedangkan polutan kimia berupa zat kimia pencemar",
    distractors: [
      "Keduanya selalu berupa mikroorganisme",
      "Polutan kimia hanya berupa suara",
      "Polutan fisik selalu berupa gas beracun",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 81 - HIGH
  {
    text: "Analisis masuknya limbah organik berlebihan ke perairan, lalu simpulkan hubungan peristiwa tersebut dengan eutrofikasi.",
    correct:
      "Penguraian bahan organik dan peningkatan nutrien dapat memicu pertumbuhan organisme air secara berlebihan",
    distractors: [
      "Limbah organik selalu menghilangkan seluruh alga",
      "Eutrofikasi terjadi karena air kehilangan semua nutrien",
      "Limbah organik tidak memengaruhi kondisi perairan",
    ],
    weightPriority: "LOW",
  },

  // 82 - LOW
  {
    text: "Apa pengertian pencemaran air?",
    correct:
      "Masuknya bahan pencemar yang menurunkan kualitas lingkungan perairan",
    distractors: [
      "Perubahan warna langit",
      "Peningkatan jumlah batuan",
      "Perubahan nama sungai",
    ],
    weightPriority: "NORMAL",
  },

  // 83 - MEDIUM
  {
    text: "Jelaskan cara sampah plastik dan penggunaan pestisida dapat menyebabkan pencemaran tanah.",
    correct:
      "Plastik sulit terdegradasi dan pestisida dapat meresap serta mencemari tanah",
    distractors: [
      "Plastik selalu meningkatkan kesuburan tanah",
      "Pestisida hanya berubah menjadi air",
      "Keduanya tidak bertahan di lingkungan",
    ],
    weightPriority: "HIGH",
  },

  // 84 - HIGH
  {
    text: "Analisis penggunaan kendaraan bermotor dan produk yang menghasilkan CFC, lalu simpulkan masalah atmosfer yang dapat berkaitan dengan aktivitas tersebut.",
    correct:
      "Pencemaran udara dapat meningkat dan kondisi atmosfer dapat terganggu",
    distractors: [
      "Kualitas udara selalu meningkat",
      "Seluruh nitrogen atmosfer menghilang",
      "Siklus air langsung berhenti",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 85 - LOW
  {
    text: "Apa gas yang banyak dikaitkan dengan peningkatan efek rumah kaca dalam materi?",
    correct: "Karbon dioksida",
    distractors: ["Helium", "Neon", "Argon"],
    weightPriority: "LOW",
  },

  // 86 - MEDIUM
  {
    text: "Jelaskan pembentukan hujan asam yang berkaitan dengan oksida sulfur dan oksida nitrogen.",
    correct:
      "Gas pencemar bereaksi dengan uap air di atmosfer dan membentuk senyawa asam",
    distractors: [
      "Hujan asam hanya terbentuk dari oksigen murni",
      "Hujan asam tidak melibatkan atmosfer",
      "Oksida sulfur selalu berubah menjadi klorofil",
    ],
    weightPriority: "NORMAL",
  },

  // 87 - HIGH
  {
    text: "Analisis peningkatan gas rumah kaca di atmosfer, lalu simpulkan pengaruhnya terhadap suhu bumi.",
    correct:
      "Lebih banyak panas dapat tertahan sehingga suhu rata-rata bumi meningkat",
    distractors: [
      "Seluruh panas langsung keluar ke angkasa",
      "Suhu bumi selalu menurun",
      "Gas rumah kaca tidak berinteraksi dengan energi panas",
    ],
    weightPriority: "HIGH",
  },

  // 88 - LOW
  {
    text: "Apa batas kebisingan yang disebutkan sebagai ambang pencemaran suara dalam materi?",
    correct: "85 dB",
    distractors: ["20 dB", "40 dB", "200 dB"],
    weightPriority: "VERY_HIGH",
  },

  // 89 - MEDIUM
  {
    text: "Bedakan kebisingan impulsif dan kebisingan kontinu berdasarkan pola waktunya.",
    correct:
      "Impulsif berlangsung singkat sedangkan kontinu berlangsung terus-menerus dalam waktu lama",
    distractors: [
      "Keduanya selalu berlangsung satu detik",
      "Kebisingan kontinu tidak menghasilkan suara",
      "Kebisingan impulsif hanya terjadi di dalam air",
    ],
    weightPriority: "LOW",
  },

  // 90 - HIGH
  {
    text: "Analisis suara petasan, palu yang dipukulkan berulang, kereta yang melintas, dan mesin pabrik, lalu simpulkan dasar pengelompokan jenis kebisingan tersebut.",
    correct:
      "Pola kemunculan dan lamanya bunyi digunakan untuk membedakan jenis kebisingan",
    distractors: [
      "Semua bunyi digolongkan berdasarkan warna sumbernya",
      "Jenis kebisingan ditentukan oleh jumlah tumbuhan",
      "Semua sumber bunyi termasuk satu kategori",
    ],
    weightPriority: "NORMAL",
  },

  // 91 - LOW
  {
    text: "Apa fungsi penyaringan pada pengolahan limbah cair secara fisika?",
    correct: "Memisahkan partikel berukuran besar dari bahan cair",
    distractors: [
      "Menghasilkan virus baru",
      "Mengubah seluruh air menjadi gas",
      "Meningkatkan kadar logam berat",
    ],
    weightPriority: "HIGH",
  },

  // 92 - MEDIUM
  {
    text: "Jelaskan peran mikroorganisme pada pengolahan limbah cair secara biologi.",
    correct:
      "Mikroorganisme membantu menguraikan limbah menjadi zat yang lebih sederhana atau kurang berbahaya",
    distractors: [
      "Mikroorganisme menambah semua logam berat",
      "Mikroorganisme menghentikan seluruh penguraian",
      "Mikroorganisme selalu membuat limbah lebih beracun",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 93 - HIGH
  {
    text: "Analisis limbah cair yang mengandung logam berat dan senyawa berbahaya, lalu simpulkan metode pengolahan yang paling sesuai menurut materi.",
    correct:
      "Pengolahan kimia dengan bahan yang membantu memisahkan atau mengendapkan pencemar",
    distractors: [
      "Membuang limbah langsung tanpa pengolahan",
      "Menambahkan sampah plastik",
      "Menggunakan suara sebagai satu-satunya pengolahan",
    ],
    weightPriority: "LOW",
  },

  // 94 - LOW
  {
    text: "Apa contoh limbah organik yang dapat diolah menjadi kompos?",
    correct: "Sisa sayuran dan daun",
    distractors: ["Baterai bekas", "Kaca", "Logam berat"],
    weightPriority: "NORMAL",
  },

  // 95 - MEDIUM
  {
    text: "Jelaskan manfaat pengomposan sebagai cara mengolah limbah padat organik.",
    correct:
      "Sampah organik dapat diubah menjadi bahan yang lebih bermanfaat bagi tanah",
    distractors: [
      "Kompos membuat sampah menjadi logam",
      "Pengomposan menghilangkan seluruh mikroorganisme",
      "Pengomposan hanya berlaku untuk kaca",
    ],
    weightPriority: "HIGH",
  },

  // 96 - HIGH
  {
    text: "Analisis campuran sampah organik, plastik, dan bahan yang dapat dibakar, lalu simpulkan alasan pengelolaan limbah padat perlu disesuaikan dengan jenis sampahnya.",
    correct:
      "Setiap jenis sampah memiliki sifat berbeda sehingga metode pengolahannya tidak selalu sama",
    distractors: [
      "Semua sampah harus diperlakukan dengan satu cara",
      "Jenis sampah tidak memengaruhi metode pengolahan",
      "Semua sampah dapat langsung dibuang ke sungai",
    ],
    weightPriority: "VERY_HIGH",
  },

  // 97 - LOW
  {
    text: "Apa pengertian daur ulang dalam pengelolaan sampah?",
    correct:
      "Pengolahan kembali material agar dapat dimanfaatkan sebagai produk atau bahan baru",
    distractors: [
      "Pembuangan seluruh sampah ke lingkungan",
      "Pembakaran semua bahan tanpa pemilahan",
      "Penimbunan sampah di sungai",
    ],
    weightPriority: "LOW",
  },

  // 98 - MEDIUM
  {
    text: "Jelaskan cara mengurangi limbah gas dari penggunaan bahan bakar fosil.",
    correct:
      "Mengurangi atau mengganti penggunaan bahan bakar fosil dengan pilihan yang lebih rendah pencemarannya",
    distractors: [
      "Meningkatkan pembakaran batu bara",
      "Menambah kendaraan tanpa batas",
      "Menggunakan lebih banyak bahan bakar beremisi tinggi",
    ],
    weightPriority: "NORMAL",
  },

  // 99 - HIGH
  {
    text: "Analisis kondisi musim kering yang semakin panjang dalam konteks perubahan iklim, lalu simpulkan kemungkinan dampaknya terhadap ketersediaan air dan kehidupan organisme.",
    correct:
      "Ketersediaan air dapat menurun dan organisme dapat mengalami tekanan lingkungan yang lebih besar",
    distractors: [
      "Air selalu semakin melimpah",
      "Perubahan iklim tidak memengaruhi organisme",
      "Semua ekosistem menjadi identik",
    ],
    weightPriority: "HIGH",
  },

  // 100 - LOW
  {
    text: "Apa contoh tindakan awal yang membantu pengelolaan sampah padat di lingkungan rumah atau sekolah?",
    correct: "Memisahkan sampah berdasarkan jenisnya sejak awal",
    distractors: [
      "Mencampur seluruh sampah",
      "Membuang sampah ke sungai",
      "Membakar seluruh sampah di ruang tertutup",
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
     * Distribusi jawaban:
     *
     * 1 -> A
     * 2 -> B
     * 3 -> C
     * 4 -> D
     *
     * diulang terus sampai 100,
     * sehingga masing-masing tepat 25.
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

function validateDifficultyDistribution(questions: RawQuestion[]) {
  const counts: Record<DifficultyLevel, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  };

  for (const question of questions) {
    const difficulty = classifyQuestionDifficulty({
      questionText: question.questionText,

      imageAltText: null,

      hasImage: false,
    });

    counts[difficulty.difficultyLevel] += 1;
  }

  if (counts.LOW !== 34 || counts.MEDIUM !== 33 || counts.HIGH !== 33) {
    throw new Error(
      [
        "Distribusi difficulty tidak sesuai.",
        `LOW=${counts.LOW}`,
        `MEDIUM=${counts.MEDIUM}`,
        `HIGH=${counts.HIGH}`,
      ].join(" "),
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

    /*
     * Enrollment kita hapus eksplisit.
     */
    await prisma.tryoutEnrollment.deleteMany({
      where: {
        tryoutId: tryout.id,
      },
    });

    /*
     * Session + answer sebaiknya memakai:
     *
     * onDelete: Cascade
     *
     * pada schema Prisma.
     *
     * Jadi ketika tryout dihapus,
     * session dan answer ikut hilang.
     */
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

  /*
   * Karena subject ini khusus bank seed
   * Biologi Kelas 10 milik teacher,
   * semua soal lama pada subject
   * dibersihkan sebelum dibuat ulang.
   */
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
     * Difficulty murni berasal dari
     * classifier skripsi.
     */
    const difficulty = classifyQuestionDifficulty({
      questionText: rawQuestion.questionText,

      imageAltText: null,

      hasImage: false,
    });

    /*
     * WRS Weight murni berasal dari
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

async function createTryout(
  teacherId: string,

  subjectId: string,
) {
  const joinCode = await generateUniqueJoinCode();

  return prisma.tryout.create({
    data: {
      subjectId,

      ownerId: teacherId,

      title: TRYOUT_TITLE,

      /*
       * Bank berisi 100 soal.
       *
       * Tetapi satu session
       * hanya menggunakan 20 soal.
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

async function printDatabaseDistribution(
  teacherId: string,

  subjectId: string,
) {
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

  /*
   * 1. Validate total source.
   */
  assertQuestionCount();

  /*
   * 2. Get teacher.
   */
  const teacher = await getTeacher();

  console.log(`Teacher: ${teacher.name}`);

  console.log(`Email: ${teacher.email}`);

  /*
   * 3. Find/create subject.
   */
  const subject = await findOrCreateSubject(teacher.id);

  console.log(`Bank soal: ${subject.name}`);

  /*
   * 4. Build options.
   */
  const questions = buildQuestions(biologySources);

  /*
   * 5. Validate thesis classifier.
   */
  const difficultyCounts = validateDifficultyDistribution(questions);

  /*
   * 6. Validate explicit WRS priority.
   */
  const priorityCounts = validatePriorityDistribution(questions);

  /*
   * 7. Validate answer position.
   */
  const answerCounts = validateAnswerDistribution(questions);

  /*
   * 8. Show base WRS weight ratio.
   *
   * Catatan:
   * probability sebenarnya saat pemilihan
   * tetap dinamis berdasarkan kandidat
   * pada level difficulty yang tersedia.
   */
  const wrsProbability = getWrsPriorityProbability();

  console.log("");

  console.log("Validated difficulty:");

  console.table(difficultyCounts);

  console.log("");

  console.log("Validated WRS priority:");

  console.table(priorityCounts);

  console.log("");

  console.log("WRS base probability by priority:");

  console.table(wrsProbability);

  console.log("");

  console.log("Validated correct answer:");

  console.table(answerCounts);

  /*
   * 9. Destructive reset.
   */
  console.log("");

  console.log("Cleaning old seed data...");

  await cleanupExistingData(teacher.id, subject.id);

  /*
   * 10. Create 100 questions.
   */
  console.log("");

  console.log("Creating 100 Biologi questions...");

  await seedQuestions(teacher.id, subject.id, questions);

  /*
   * 11. Create new tryout.
   */
  console.log("");

  console.log("Creating Biologi tryout...");

  const tryout = await createTryout(teacher.id, subject.id);

  /*
   * 12. Final validation.
   */
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
