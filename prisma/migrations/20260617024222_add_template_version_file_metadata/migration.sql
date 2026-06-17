-- AlterTable
ALTER TABLE "contract_template_versions" ADD COLUMN     "docx_sha256" TEXT,
ADD COLUMN     "file_size_bytes" INTEGER,
ADD COLUMN     "mime_type" TEXT,
ADD COLUMN     "original_file_name" TEXT;
