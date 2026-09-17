# Gotenberg PDF tools

The Gotenberg-backed PDF tools in Nexus Plus reuse the existing configured Gotenberg service.

Current PDF Engine routes used by these tools include:

- Watermark: `/forms/pdfengines/watermark`
- Flatten: `/forms/pdfengines/flatten`
- Metadata read: `/forms/pdfengines/metadata/read`
- Metadata write: `/forms/pdfengines/metadata/write`

The configured base URL remains centralized in `features/pdf-word/pdfWordConversion.ts` and no additional Gotenberg server is introduced.
