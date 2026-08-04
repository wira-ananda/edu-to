# ============================================================
# 00_setup.R
# Persiapan paket, folder, dan fungsi bantuan
# ============================================================

options(
    repos = c(CRAN = "https://cloud.r-project.org"),
    stringsAsFactors = FALSE,
    scipen = 999
)

# ------------------------------------------------------------
# Paket yang digunakan
# ------------------------------------------------------------

packages <- c(
    "here",
    "jsonlite",
    "readxl",
    "readr",
    "dplyr",
    "tidyr",
    "stringr",
    "janitor",
    "ggplot2",
    "scales",
    "writexl",
    "psych",
    "lubridate",
    "purrr",
    "tibble",
    "broom"
)

missing_packages <- packages[
    !vapply(
        packages,
        requireNamespace,
        logical(1),
        quietly = TRUE
    )
]

if (length(missing_packages) > 0) {
    install.packages(missing_packages)
}

suppressPackageStartupMessages(
    invisible(
        lapply(
            packages,
            library,
            character.only = TRUE
        )
    )
)

# ------------------------------------------------------------
# Folder proyek
# ------------------------------------------------------------

project_folders <- c(
    here("analytics", "data", "raw"),
    here("analytics", "data", "processed"),
    here("analytics", "output", "figures"),
    here("analytics", "output", "tables")
)

invisible(
    lapply(
        project_folders,
        dir.create,
        recursive = TRUE,
        showWarnings = FALSE
    )
)

# ------------------------------------------------------------
# Pengaturan grafik
# ------------------------------------------------------------

ggplot2::theme_set(
    ggplot2::theme_minimal(base_size = 12)
)

set.seed(123)

# ------------------------------------------------------------
# Fungsi bantuan
# ------------------------------------------------------------

normalize_key <- function(x) {
    x |>
        as.character() |>
        stringr::str_to_lower() |>
        stringr::str_squish() |>
        stringr::str_replace_all("[^a-z0-9]+", "")
}

first_non_missing <- function(
  x,
  default = NA
) {
    valid_values <- x[!is.na(x)]

    if (length(valid_values) == 0) {
        return(default)
    }

    valid_values[[1]]
}

save_csv_table <- function(data, file_name) {
    output_path <- here::here(
        "analytics",
        "output",
        "tables",
        file_name
    )

    readr::write_csv(
        data,
        output_path,
        na = ""
    )

    message("Tabel disimpan: ", output_path)

    invisible(output_path)
}

save_processed_csv <- function(data, file_name) {
    output_path <- here::here(
        "analytics",
        "data",
        "processed",
        file_name
    )

    readr::write_csv(
        data,
        output_path,
        na = ""
    )

    message("Data bersih disimpan: ", output_path)

    invisible(output_path)
}

save_figure <- function(
  plot_object,
  file_name,
  width = 10,
  height = 6
) {
    output_path <- here::here(
        "analytics",
        "output",
        "figures",
        file_name
    )

    ggplot2::ggsave(
        filename = output_path,
        plot = plot_object,
        width = width,
        height = height,
        dpi = 300
    )

    message("Grafik disimpan: ", output_path)

    invisible(output_path)
}

message("================================================")
message("Setup R berhasil dijalankan.")
message("Folder proyek: ", here::here())
message("Seluruh paket analisis tersedia.")
message("================================================")
