# ============================================================
# 01_import_clean.R
# Import dan pembersihan data tryout serta kuesioner
# ============================================================

source("00_setup.R")


# ============================================================
# KONFIGURASI FILE
# ============================================================

TRYOUT_FILE <- here(
    "analytics",
    "data",
    "raw",
    "tryout-biologi-kelas-10-lengkap-1-15.xlsx"
)

STUDENT_QUESTIONNAIRE_FILE <- here(
    "analytics",
    "data",
    "raw",
    "rekap_uji_coba_tryout_wira_lengkap.xlsx"
)

TEACHER_QUESTIONNAIRE_FILE <- here(
    "analytics",
    "data",
    "raw",
    "kuesioner_guru.xlsx"
)


# ============================================================
# KONFIGURASI REVERSE SCORING
# ============================================================

# Isi setelah memeriksa file pemetaan item.
#
# Contoh:
# REVERSE_ITEMS_STUDENT <- c("item_03", "item_08")
#
# Rumus reverse scoring:
# skor baru = 6 - skor lama

REVERSE_ITEMS_STUDENT <- character(0)
REVERSE_ITEMS_TEACHER <- character(0)


# ============================================================
# OPERATOR BANTUAN
# ============================================================

`%||%` <- function(x, y) {
    if (
        is.null(x) ||
            length(x) == 0 ||
            all(is.na(x))
    ) {
        y
    } else {
        x
    }
}


# ============================================================
# FUNGSI MEMILIH DAN MEMBACA SHEET EXCEL
# ============================================================

choose_excel_sheet <- function(
  file_path,
  preferred_sheets = c(
      "detail_soal",
      "detail",
      "data",
      "tryout",
      "sheet1"
  )
) {
    available_sheets <- readxl::excel_sheets(
        file_path
    )

    normalized_sheets <- janitor::make_clean_names(
        available_sheets
    )

    preferred_match <- match(
        preferred_sheets,
        normalized_sheets
    )

    preferred_match <- preferred_match[
        !is.na(preferred_match)
    ]

    if (length(preferred_match) > 0) {
        return(
            available_sheets[
                preferred_match[1]
            ]
        )
    }

    available_sheets[1]
}


read_excel_automatically <- function(
  file_path,
  preferred_sheets = c(
      "detail_soal",
      "detail",
      "data",
      "tryout",
      "sheet1"
  )
) {
    if (!file.exists(file_path)) {
        stop(
            "File tidak ditemukan: ",
            file_path
        )
    }

    selected_sheet <- choose_excel_sheet(
        file_path,
        preferred_sheets
    )

    message(
        "Membaca file ",
        basename(file_path),
        " pada sheet: ",
        selected_sheet
    )

    readxl::read_excel(
        file_path,
        sheet = selected_sheet
    ) |>
        janitor::clean_names()
}


# ============================================================
# FUNGSI PENCARIAN KOLOM
# ============================================================

find_column <- function(
  data,
  candidates,
  required = FALSE,
  label = NULL
) {
    available_names <- names(data)

    exact_match <- intersect(
        candidates,
        available_names
    )

    if (length(exact_match) > 0) {
        return(exact_match[1])
    }

    if (required) {
        stop(
            "Kolom ",
            label %||% paste(
                candidates,
                collapse = "/"
            ),
            " tidak ditemukan.\n\n",
            "Kolom yang tersedia:\n",
            paste(
                available_names,
                collapse = ", "
            )
        )
    }

    NA_character_
}


get_column_value <- function(
  data,
  column_name,
  default = NA_character_
) {
    if (
        length(column_name) == 0 ||
            is.na(column_name) ||
            !column_name %in% names(data)
    ) {
        return(
            rep(
                default,
                nrow(data)
            )
        )
    }

    data[[column_name]]
}


# ============================================================
# FUNGSI NORMALISASI DATA
# ============================================================

normalize_level <- function(x) {
    value <- x |>
        as.character() |>
        stringr::str_to_lower() |>
        stringr::str_squish()

    dplyr::case_when(
        value %in% c(
            "low",
            "mudah",
            "rendah",
            "easy"
        ) ~ "LOW",
        value %in% c(
            "medium",
            "sedang",
            "normal",
            "moderate"
        ) ~ "MEDIUM",
        value %in% c(
            "high",
            "sulit",
            "tinggi",
            "hard"
        ) ~ "HIGH",
        TRUE ~ NA_character_
    )
}


parse_boolean <- function(x) {
    if (is.logical(x)) {
        return(x)
    }

    if (is.numeric(x)) {
        return(
            dplyr::case_when(
                x == 1 ~ TRUE,
                x == 0 ~ FALSE,
                TRUE ~ NA
            )
        )
    }

    value <- x |>
        as.character() |>
        stringr::str_to_lower() |>
        stringr::str_squish()

    dplyr::case_when(
        value %in% c(
            "true",
            "benar",
            "correct",
            "betul",
            "ya",
            "yes",
            "1"
        ) ~ TRUE,
        value %in% c(
            "false",
            "salah",
            "incorrect",
            "tidak",
            "no",
            "0"
        ) ~ FALSE,
        TRUE ~ NA
    )
}


parse_numeric_value <- function(x) {
    suppressWarnings(
        readr::parse_number(
            as.character(x)
        )
    )
}


# ============================================================
# MEMBACA DATA TRYOUT
# ============================================================

tryout_raw <- readxl::read_excel(
    TRYOUT_FILE,
    sheet = "Detail 1-15",
    skip = 3
) |>
    janitor::clean_names()

# ============================================================
# MEMBACA SHEET RINGKASAN SISWA
# Header terdapat pada baris ke-3
# ============================================================

ringkasan_siswa_raw <- readxl::read_excel(
    TRYOUT_FILE,
    sheet = "Ringkasan Siswa",
    skip = 2
) |>
    janitor::clean_names()

# ============================================================
# MEMBACA SHEET RINGKASAN NOMOR SOAL
# Header terdapat pada baris ke-3
# ============================================================

ringkasan_no_soal_raw <- readxl::read_excel(
    TRYOUT_FILE,
    sheet = "Ringkasan No Soal",
    skip = 2
) |>
    janitor::clean_names()

message("\nKolom asli data tryout:")
print(names(tryout_raw))

message("\nKolom Ringkasan Siswa:")
print(names(ringkasan_siswa_raw))

message("\nKolom Ringkasan Nomor Soal:")
print(names(ringkasan_no_soal_raw))

# ============================================================
# MENDETEKSI KOLOM DATA TRYOUT
# ============================================================

student_id_column <- find_column(
    tryout_raw,
    c(
        "student_id",
        "id_siswa",
        "siswa_id",
        "id_peserta",
        "peserta_id"
    )
)


student_name_column <- find_column(
    tryout_raw,
    c(
        "student_name",
        "nama_siswa",
        "nama_peserta",
        "siswa",
        "peserta",
        "name"
    ),
    required = TRUE,
    label = "nama siswa"
)


attempt_column <- find_column(
    tryout_raw,
    c(
        "attempt_number",
        "attempt",
        "percobaan",
        "nomor_percobaan",
        "percobaan_ke"
    ),
    required = TRUE,
    label = "nomor percobaan"
)


question_number_column <- find_column(
    tryout_raw,
    c(
        "question_number",
        "nomor_soal",
        "no_soal",
        "soal_ke",
        "urutan_soal",
        "nomor"
    ),
    required = TRUE,
    label = "nomor soal"
)


question_id_column <- find_column(
    tryout_raw,
    c(
        "question_id",
        "id_soal",
        "soal_id"
    )
)


question_text_column <- find_column(
    tryout_raw,
    c(
        "question_text",
        "text",
        "teks_soal",
        "teks_soal_yang_diperoleh",
        "pertanyaan",
        "soal",
        "isi_soal"
    ),
    required = TRUE,
    label = "teks soal"
)

difficulty_column <- find_column(
    tryout_raw,
    c(
        "difficulty",
        "difficulty_level",
        "tingkat_kesulitan",
        "kesulitan",
        "level_soal"
    ),
    required = TRUE,
    label = "tingkat kesulitan"
)


weight_column <- find_column(
    tryout_raw,
    c(
        "weight",
        "bobot",
        "priority_weight",
        "bobot_prioritas",
        "nilai_bobot"
    ),
    required = TRUE,
    label = "bobot"
)


answer_key_column <- find_column(
    tryout_raw,
    c(
        "answer_key",
        "correct_answer",
        "kunci_jawaban",
        "jawaban_benar",
        "kunci"
    )
)


is_correct_column <- find_column(
    tryout_raw,
    c(
        "is_correct",
        "benar_salah",
        "hasil_jawaban",
        "status_jawaban",
        "hasil",
        "benar"
    ),
    required = TRUE,
    label = "hasil benar atau salah"
)


initial_level_column <- find_column(
    tryout_raw,
    c(
        "initial_level",
        "level_awal",
        "tingkat_awal",
        "initial_difficulty"
    )
)


final_level_column <- find_column(
    tryout_raw,
    c(
        "final_level",
        "level_akhir",
        "tingkat_akhir",
        "final_difficulty"
    )
)


selection_level_column <- find_column(
    tryout_raw,
    c(
        "selection_level",
        "current_level",
        "level_saat_dipilih",
        "tingkat_saat_dipilih"
    )
)


candidate_count_column <- find_column(
    tryout_raw,
    c(
        "candidate_count",
        "jumlah_kandidat",
        "total_kandidat"
    )
)


total_weight_column <- find_column(
    tryout_raw,
    c(
        "total_weight",
        "total_bobot",
        "jumlah_bobot"
    )
)


random_value_column <- find_column(
    tryout_raw,
    c(
        "random_value",
        "nilai_acak",
        "angka_acak"
    )
)


# ============================================================
# MEMBENTUK DATA TRYOUT BERSIH
# ============================================================

tryout_clean <- tibble::tibble(
    student_id = as.character(
        get_column_value(
            tryout_raw,
            student_id_column
        )
    ),
    student_name = stringr::str_squish(
        as.character(
            get_column_value(
                tryout_raw,
                student_name_column
            )
        )
    ),
    attempt_number = as.integer(
        parse_numeric_value(
            get_column_value(
                tryout_raw,
                attempt_column
            )
        )
    ),
    question_number = as.integer(
        parse_numeric_value(
            get_column_value(
                tryout_raw,
                question_number_column
            )
        )
    ),
    question_id = as.character(
        get_column_value(
            tryout_raw,
            question_id_column
        )
    ),
    question_text = stringr::str_squish(
        as.character(
            get_column_value(
                tryout_raw,
                question_text_column
            )
        )
    ),
    difficulty = normalize_level(
        get_column_value(
            tryout_raw,
            difficulty_column
        )
    ),
    weight = parse_numeric_value(
        get_column_value(
            tryout_raw,
            weight_column
        )
    ),
    answer_key = stringr::str_to_upper(
        stringr::str_squish(
            as.character(
                get_column_value(
                    tryout_raw,
                    answer_key_column
                )
            )
        )
    ),
    is_correct = parse_boolean(
        get_column_value(
            tryout_raw,
            is_correct_column
        )
    ),
    initial_level = normalize_level(
        get_column_value(
            tryout_raw,
            initial_level_column
        )
    ),
    final_level = normalize_level(
        get_column_value(
            tryout_raw,
            final_level_column
        )
    )
)


# ============================================================
# FILTER DATA TRYOUT VALID
# ============================================================

tryout_clean <- tryout_clean |>
    dplyr::filter(
        !is.na(student_name),
        student_name != "",
        !is.na(attempt_number),
        attempt_number %in% c(1, 2),
        !is.na(question_number),
        question_number %in% 1:15,

        # Menghapus baris percobaan yang sebenarnya kosong
        !is.na(question_text),
        question_text != "",
        !is.na(difficulty),
        !is.na(weight)
    )


# ============================================================
# MENGELUARKAN DIAN MEYLANI PRATIWI
# ============================================================

tryout_clean <- tryout_clean |>
    dplyr::filter(
        normalize_key(student_name) !=
            normalize_key(
                "Dian Meylani Pratiwi"
            )
    )


# ============================================================
# MEMBUAT KUNCI IDENTITAS SISWA
# ============================================================

tryout_clean <- tryout_clean |>
    dplyr::mutate(
        student_key = dplyr::if_else(
            !is.na(student_id) &
                student_id != "",
            normalize_key(student_id),
            normalize_key(student_name)
        )
    )


# ============================================================
# MEMBUAT ID SOAL OTOMATIS JIKA KOSONG
# ============================================================

missing_question_id <- is.na(
    tryout_clean$question_id
) |
    tryout_clean$question_id == ""


generated_question_ids <- paste0(
    "AUTO_Q",
    sprintf(
        "%03d",
        match(
            tryout_clean$question_text,
            unique(
                tryout_clean$question_text
            )
        )
    )
)


tryout_clean$question_id[
    missing_question_id
] <- generated_question_ids[
    missing_question_id
]


# ============================================================
# AUDIT DUPLIKASI POSISI SOAL
# ============================================================

duplicate_position_audit <- tryout_clean |>
    dplyr::count(
        student_key,
        student_name,
        attempt_number,
        question_number,
        name = "duplicate_count"
    ) |>
    dplyr::filter(
        duplicate_count > 1
    )


# ============================================================
# MENYISAKAN SATU BARIS PER POSISI SOAL
# ============================================================

tryout_clean <- tryout_clean |>
    dplyr::arrange(
        student_name,
        attempt_number,
        question_number
    ) |>
    dplyr::distinct(
        student_key,
        attempt_number,
        question_number,
        .keep_all = TRUE
    )
# Menghitung total weight yang diterima setiap siswa
# dalam satu percobaan

tryout_clean <- tryout_clean |>
    dplyr::group_by(
        student_key,
        student_name,
        attempt_number
    ) |>
    dplyr::mutate(
        session_total_weight = sum(
            weight,
            na.rm = TRUE
        ),
        session_weight_correct = sum(
            dplyr::if_else(
                is_correct %in% TRUE,
                weight,
                0
            ),
            na.rm = TRUE
        )
    ) |>
    dplyr::ungroup()

# ============================================================
# AUDIT KELENGKAPAN SESI TRYOUT
# ============================================================

session_audit <- tryout_clean |>
    dplyr::group_by(
        student_key,
        student_name,
        attempt_number
    ) |>
    dplyr::summarise(
        total_rows = dplyr::n(),
        unique_question_numbers =
            dplyr::n_distinct(
                question_number
            ),
        unique_question_ids =
            dplyr::n_distinct(
                question_id
            ),
        missing_answers = sum(
            is.na(is_correct)
        ),
        total_correct = sum(
            is_correct %in% TRUE,
            na.rm = TRUE
        ),
        total_wrong = sum(
            is_correct %in% FALSE,
            na.rm = TRUE
        ),
        .groups = "drop"
    ) |>
    dplyr::mutate(
        complete_session =
            unique_question_numbers == 15 &
                missing_answers == 0
    )


# ============================================================
# AUDIT KEMUNGKINAN NAMA GANDA
# ============================================================

potential_name_duplicates <- tryout_clean |>
    dplyr::distinct(
        student_key,
        student_name
    ) |>
    dplyr::mutate(
        simplified_name =
            normalize_key(student_name)
    ) |>
    dplyr::count(
        simplified_name,
        name = "name_count"
    ) |>
    dplyr::filter(
        name_count > 1
    )


# ============================================================
# MENYIMPAN DATA TRYOUT
# ============================================================

save_processed_csv(
    tryout_clean,
    "tryout_clean.csv"
)


save_csv_table(
    session_audit,
    "audit_sesi_tryout.csv"
)


save_csv_table(
    duplicate_position_audit,
    "audit_duplikasi_posisi_soal.csv"
)


save_csv_table(
    potential_name_duplicates,
    "audit_kemungkinan_nama_ganda.csv"
)

# ============================================================
# MEMBERSIHKAN RINGKASAN SISWA
# ============================================================

ringkasan_siswa_clean <- ringkasan_siswa_raw |>
    dplyr::transmute(
        student_name = stringr::str_squish(
            as.character(nama_siswa)
        ),
        student_id = as.character(id_siswa),
        attempt_number = as.integer(attempt),
        initial_level = normalize_level(
            level_awal
        ),
        final_level = normalize_level(
            level_akhir
        ),
        available_questions = as.integer(
            soal_tersedia
        ),
        correct_count = as.integer(benar),
        wrong_count = as.integer(salah),
        unavailable_count = as.integer(
            tidak_ada_data
        ),
        accuracy = as.numeric(
            percent_benar
        ) * 100,
        session_total_weight = as.numeric(
            total_weight
        ),
        session_weight_correct = as.numeric(
            weight_benar
        ),
        weighted_accuracy = as.numeric(
            percent_weight_benar
        ) * 100
    ) |>
    dplyr::filter(
        !is.na(student_name),
        student_name != "",
        normalize_key(student_name) !=
            normalize_key(
                "Dian Meylani Pratiwi"
            )
    ) |>
    dplyr::mutate(
        student_key = dplyr::if_else(
            !is.na(student_id) &
                student_id != "",
            normalize_key(student_id),
            normalize_key(student_name)
        )
    )


save_processed_csv(
    ringkasan_siswa_clean,
    "ringkasan_siswa_clean.csv"
)
# ============================================================
# MEMBERSIHKAN RINGKASAN NOMOR SOAL
# ============================================================

ringkasan_no_soal_clean <- ringkasan_no_soal_raw |>
    dplyr::transmute(
        question_number = as.integer(
            no_soal
        ),
        attempt_number = as.integer(
            attempt
        ),
        available_data = as.integer(
            data_tersedia
        ),
        correct_count = as.integer(benar),
        wrong_count = as.integer(salah),
        accuracy = as.numeric(akurasi) * 100,
        low_count = as.integer(level_low),
        medium_count = as.integer(
            level_medium
        ),
        high_count = as.integer(
            level_high
        ),
        total_selected_weight = as.numeric(
            total_weight
        ),
        correct_selected_weight = as.numeric(
            weight_benar
        ),
        weighted_accuracy = as.numeric(
            percent_weight_benar
        ) * 100
    ) |>
    dplyr::filter(
        !is.na(question_number),
        question_number %in% 1:15,
        attempt_number %in% c(1, 2)
    )


save_processed_csv(
    ringkasan_no_soal_clean,
    "ringkasan_no_soal_clean.csv"
)

# ============================================================
# FUNGSI PARSING SKALA LIKERT
# ============================================================

parse_likert <- function(x) {
    if (is.numeric(x)) {
        result <- as.numeric(x)

        result[
            !result %in% 1:5
        ] <- NA_real_

        return(result)
    }

    value <- stringr::str_squish(
        as.character(x)
    )

    direct_number <- suppressWarnings(
        as.numeric(value)
    )

    extracted_number <- suppressWarnings(
        as.numeric(
            stringr::str_extract(
                value,
                "(?<![0-9])[1-5](?![0-9])"
            )
        )
    )

    result <- dplyr::coalesce(
        direct_number,
        extracted_number
    )

    result[
        !result %in% 1:5
    ] <- NA_real_

    result
}


# ============================================================
# FUNGSI MENDETEKSI KOLOM LIKERT
# ============================================================

detect_likert_columns <- function(data) {
    q_columns <- names(data)[
        stringr::str_detect(
            names(data),
            "^q[0-9]+$"
        )
    ]

    if (length(q_columns) > 0) {
        question_numbers <- as.integer(
            stringr::str_extract(
                q_columns,
                "[0-9]+"
            )
        )

        return(
            q_columns[
                order(question_numbers)
            ]
        )
    }
    excluded_pattern <- paste(
        c(
            "timestamp",
            "stempel_waktu",
            "waktu",
            "tanggal",
            "nama",
            "name",
            "email",
            "kelas",
            "class",
            "sekolah",
            "school",
            "jenis_kelamin",
            "gender",
            "usia",
            "umur",
            "role",
            "peran"
        ),
        collapse = "|"
    )

    candidate_columns <- names(data)[
        !stringr::str_detect(
            names(data),
            excluded_pattern
        )
    ]

    detected <- candidate_columns[
        vapply(
            candidate_columns,
            function(column_name) {
                parsed <- parse_likert(
                    data[[column_name]]
                )

                original_non_missing <- sum(
                    !is.na(
                        data[[column_name]]
                    ) &
                        as.character(
                            data[[column_name]]
                        ) != ""
                )

                parsed_non_missing <- sum(
                    !is.na(parsed)
                )

                if (original_non_missing == 0) {
                    return(FALSE)
                }

                parsed_ratio <-
                    parsed_non_missing /
                        original_non_missing

                parsed_ratio >= 0.80 &&
                    parsed_non_missing >= 1
            },
            logical(1)
        )
    ]

    detected
}


# ============================================================
# FUNGSI PARSING TIMESTAMP
# ============================================================

parse_timestamp_column <- function(x) {
    if (inherits(x, "POSIXt")) {
        return(
            as.POSIXct(
                x,
                tz = "Asia/Makassar"
            )
        )
    }

    suppressWarnings(
        lubridate::parse_date_time(
            as.character(x),
            orders = c(
                "Ymd HMS",
                "Ymd HM",
                "dmY HMS",
                "dmY HM",
                "mdY HMS",
                "mdY HM",
                "dmy HMS",
                "dmy HM"
            ),
            tz = "Asia/Makassar",
            quiet = TRUE
        )
    )
}


# ============================================================
# FUNGSI PEMBERSIHAN KUESIONER
# ============================================================

clean_questionnaire <- function(
  file_path,
  respondent_type,
  reverse_items = character(0)
) {
    if (!file.exists(file_path)) {
        message(
            "File kuesioner tidak ditemukan dan dilewati: ",
            file_path
        )

        return(NULL)
    }

    if (respondent_type == "siswa") {
        # Hanya membaca tabel respons siswa.
        # Baris 4 adalah header dan baris 5–40 adalah 36 respons.
        raw_data <- readxl::read_excel(
            file_path,
            sheet = "Kuesioner",
            range = "A4:AB40"
        ) |>
            janitor::clean_names()
    } else {
        raw_data <- read_excel_automatically(
            file_path,
            preferred_sheets = c(
                "form_responses_1",
                "jawaban_formulir_1",
                "kuesioner",
                "data",
                "sheet1"
            )
        )
    }

    message(
        "\nKolom kuesioner ",
        respondent_type,
        ":"
    )

    print(
        names(raw_data)
    )


    # --------------------------------------------------------
    # Mendeteksi kolom identitas
    # --------------------------------------------------------

    timestamp_column <- find_column(
        raw_data,
        c(
            "timestamp",
            "stempel_waktu",
            "waktu_pengisian",
            "tanggal_pengisian",
            "submitted_at",
            "created_at"
        )
    )


    email_column <- find_column(
        raw_data,
        c(
            "email",
            "alamat_email",
            "email_address"
        )
    )


    name_column <- find_column(
        raw_data,
        c(
            "nama",
            "name",
            "nama_lengkap",
            "nama_siswa",
            "nama_guru",
            "responden"
        )
    )


    class_column <- find_column(
        raw_data,
        c(
            "kelas",
            "class",
            "kelas_siswa"
        )
    )


    school_column <- find_column(
        raw_data,
        c(
            "sekolah",
            "school",
            "nama_sekolah"
        )
    )


    # --------------------------------------------------------
    # Mendeteksi item Likert
    # --------------------------------------------------------

    likert_columns <- detect_likert_columns(
        raw_data
    )

    if (length(likert_columns) == 0) {
        stop(
            "Tidak ada kolom Likert 1-5 yang terdeteksi pada ",
            basename(file_path)
        )
    }


    item_names <- paste0(
        "item_",
        sprintf(
            "%02d",
            seq_along(likert_columns)
        )
    )


    item_mapping <- tibble::tibble(
        item = item_names,
        original_column =
            likert_columns,
        statement =
            stringr::str_replace_all(
                likert_columns,
                "_",
                " "
            )
    )


    item_data <- purrr::map_dfc(
        likert_columns,
        function(column_name) {
            tibble::tibble(
                value = parse_likert(
                    raw_data[[column_name]]
                )
            )
        }
    )

    names(item_data) <- item_names


    # --------------------------------------------------------
    # Membentuk data identitas responden
    # --------------------------------------------------------

    timestamp_value <- get_column_value(
        raw_data,
        timestamp_column
    )


    questionnaire_clean <- tibble::tibble(
        original_row = seq_len(
            nrow(raw_data)
        ),
        timestamp = parse_timestamp_column(
            timestamp_value
        ),
        respondent_name =
            stringr::str_squish(
                as.character(
                    get_column_value(
                        raw_data,
                        name_column
                    )
                )
            ),
        email =
            stringr::str_to_lower(
                stringr::str_squish(
                    as.character(
                        get_column_value(
                            raw_data,
                            email_column
                        )
                    )
                )
            ),
        class =
            stringr::str_squish(
                as.character(
                    get_column_value(
                        raw_data,
                        class_column
                    )
                )
            ),
        school =
            stringr::str_squish(
                as.character(
                    get_column_value(
                        raw_data,
                        school_column
                    )
                )
            )
    ) |>
        dplyr::bind_cols(
            item_data
        )


    # --------------------------------------------------------
    # Mengeluarkan Dian Meylani Pratiwi
    # --------------------------------------------------------

    questionnaire_clean <- questionnaire_clean |>
        dplyr::filter(
            is.na(respondent_name) |
                normalize_key(respondent_name) !=
                    normalize_key(
                        "Dian Meylani Pratiwi"
                    )
        )


    # --------------------------------------------------------
    # Membuat identitas responden
    # --------------------------------------------------------

    questionnaire_clean <- questionnaire_clean |>
        dplyr::mutate(
            respondent_key =
                dplyr::case_when(
                    !is.na(email) &
                        email != "" ~
                        normalize_key(email),
                    !is.na(respondent_name) &
                        respondent_name != "" ~
                        normalize_key(
                            respondent_name
                        ),
                    TRUE ~ paste0(
                        respondent_type,
                        "_row_",
                        original_row
                    )
                )
        )


    item_columns <- names(
        questionnaire_clean
    )[
        stringr::str_detect(
            names(questionnaire_clean),
            "^item_"
        )
    ]


    # --------------------------------------------------------
    # Mendeteksi respons dengan semua jawaban angka 1
    # --------------------------------------------------------

    non_missing_count <- rowSums(
        !is.na(
            questionnaire_clean[
                item_columns
            ]
        )
    )


    one_count <- rowSums(
        questionnaire_clean[
            item_columns
        ] == 1,
        na.rm = TRUE
    )


    questionnaire_clean <- questionnaire_clean |>
        dplyr::mutate(
            # Respons siswa dianggap valid apabila semua 20 item terisi
            valid_response =
                non_missing_count ==
                    length(item_columns),
            all_one_response =
                non_missing_count > 0 &
                    one_count == non_missing_count
        ) |>
        dplyr::filter(
            valid_response,
            !is.na(respondent_name),
            respondent_name != ""
        )
    # --------------------------------------------------------
    # Mengurutkan respons dan mendeteksi pengisian ganda
    # --------------------------------------------------------

    questionnaire_clean <- questionnaire_clean |>
        dplyr::mutate(
            timestamp_sort =
                dplyr::coalesce(
                    timestamp,
                    as.POSIXct(
                        "1900-01-01 00:00:00",
                        tz = "Asia/Makassar"
                    )
                )
        ) |>
        dplyr::arrange(
            respondent_key,
            timestamp_sort,
            original_row
        ) |>
        dplyr::group_by(
            respondent_key
        ) |>
        dplyr::mutate(
            duplicate_count =
                dplyr::n(),
            kept_record =
                dplyr::row_number() ==
                    dplyr::n()
        ) |>
        dplyr::ungroup()


    # --------------------------------------------------------
    # Audit seluruh respons ganda
    # --------------------------------------------------------

    duplicate_audit <- questionnaire_clean |>
        dplyr::filter(
            duplicate_count > 1
        )


    # --------------------------------------------------------
    # Audit respons dengan semua jawaban angka 1
    # --------------------------------------------------------

    all_one_audit <- questionnaire_clean |>
        dplyr::filter(
            all_one_response
        ) |>
        dplyr::select(
            original_row,
            timestamp,
            respondent_name,
            email,
            class,
            school,
            respondent_key,
            duplicate_count,
            kept_record,
            all_one_response,
            dplyr::all_of(
                item_columns
            )
        )


    # --------------------------------------------------------
    # Mempertahankan jawaban terakhir responden
    # --------------------------------------------------------
    questionnaire_final <- questionnaire_clean |>
        dplyr::filter(
            kept_record
        ) |>
        dplyr::select(
            -timestamp_sort,
            -kept_record,
            -valid_response
        )

    # --------------------------------------------------------
    # Reverse scoring untuk pernyataan negatif
    # --------------------------------------------------------

    valid_reverse_items <- intersect(
        reverse_items,
        item_columns
    )


    if (length(valid_reverse_items) > 0) {
        questionnaire_final <-
            questionnaire_final |>
            dplyr::mutate(
                dplyr::across(
                    dplyr::all_of(
                        valid_reverse_items
                    ),
                    ~ 6 - .x
                )
            )
    }


    # --------------------------------------------------------
    # Menyimpan hasil
    # --------------------------------------------------------

    file_prefix <- paste0(
        "kuesioner_",
        respondent_type
    )


    save_processed_csv(
        questionnaire_final,
        paste0(
            file_prefix,
            "_clean.csv"
        )
    )


    save_csv_table(
        duplicate_audit,
        paste0(
            "audit_duplikasi_",
            file_prefix,
            ".csv"
        )
    )


    save_csv_table(
        all_one_audit,
        paste0(
            "audit_semua_jawaban_satu_",
            file_prefix,
            ".csv"
        )
    )


    save_csv_table(
        item_mapping,
        paste0(
            "pemetaan_item_",
            file_prefix,
            ".csv"
        )
    )


    list(
        clean = questionnaire_final,
        duplicate_audit = duplicate_audit,
        all_one_audit = all_one_audit,
        item_mapping = item_mapping
    )
}


# ============================================================
# MEMBERSIHKAN KUESIONER SISWA
# ============================================================

student_questionnaire <- clean_questionnaire(
    STUDENT_QUESTIONNAIRE_FILE,
    respondent_type = "siswa",
    reverse_items =
        REVERSE_ITEMS_STUDENT
)


# ============================================================
# MEMBERSIHKAN KUESIONER GURU
# ============================================================

teacher_questionnaire <- clean_questionnaire(
    TEACHER_QUESTIONNAIRE_FILE,
    respondent_type = "guru",
    reverse_items =
        REVERSE_ITEMS_TEACHER
)


# ============================================================
# MEMBUAT RINGKASAN PEMBERSIHAN DATA
# ============================================================

cleaning_summary <- tibble::tibble(
    data_name = c(
        "Tryout",
        "Kuesioner siswa",
        "Kuesioner guru"
    ),
    total_clean_rows = c(
        nrow(tryout_clean),
        if (is.null(student_questionnaire)) {
            0
        } else {
            nrow(
                student_questionnaire$clean
            )
        },
        if (is.null(teacher_questionnaire)) {
            0
        } else {
            nrow(
                teacher_questionnaire$clean
            )
        }
    ),
    total_duplicate_responses = c(
        NA_integer_,
        if (is.null(student_questionnaire)) {
            0
        } else {
            nrow(
                student_questionnaire$
                    duplicate_audit
            )
        },
        if (is.null(teacher_questionnaire)) {
            0
        } else {
            nrow(
                teacher_questionnaire$
                    duplicate_audit
            )
        }
    ),
    total_all_one_responses = c(
        NA_integer_,
        if (is.null(student_questionnaire)) {
            0
        } else {
            nrow(
                student_questionnaire$
                    all_one_audit
            )
        },
        if (is.null(teacher_questionnaire)) {
            0
        } else {
            nrow(
                teacher_questionnaire$
                    all_one_audit
            )
        }
    )
)


save_csv_table(
    cleaning_summary,
    "ringkasan_pembersihan_data.csv"
)


# ============================================================
# INFORMASI HASIL
# ============================================================

message("")
message("================================================")
message("IMPORT DAN PEMBERSIHAN DATA SELESAI")
message("================================================")
message("")

message(
    "Jumlah baris tryout bersih: ",
    nrow(tryout_clean)
)

message(
    "Jumlah sesi tryout: ",
    nrow(session_audit)
)

message(
    "Jumlah sesi tryout lengkap: ",
    sum(
        session_audit$complete_session,
        na.rm = TRUE
    )
)

message(
    "Jumlah sesi tryout tidak lengkap: ",
    sum(
        !session_audit$complete_session,
        na.rm = TRUE
    )
)

message("")

message(
    "Jumlah responden siswa bersih: ",
    if (is.null(student_questionnaire)) {
        0
    } else {
        nrow(
            student_questionnaire$clean
        )
    }
)

message(
    "Jumlah responden guru bersih: ",
    if (is.null(teacher_questionnaire)) {
        0
    } else {
        nrow(
            teacher_questionnaire$clean
        )
    }
)

message("")
message(
    "Data Dian Meylani Pratiwi telah dikeluarkan."
)

message(
    "Respons kuesioner ganda mempertahankan isian terakhir."
)

message(
    "Respons dengan seluruh jawaban angka 1 disimpan dalam file audit."
)

message("")
message("================================================")
