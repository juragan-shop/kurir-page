import { defineType, defineField } from "sanity";

export const fish = defineType({
  name: "fish",
  title: "Data Ikan",
  type: "document",

  fields: [
    defineField({
      name: "name",
      title: "Jenis Ikan",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "category",
      title: "Kategori",
      type: "string",
      options: {
        list: [
          { title: "Tumpuk", value: "Tumpuk" },
          { title: "Partai", value: "Partai" },
          { title: "Kg", value: "Kg" },
          { title: "Kantong", value: "Kantong" },
          { title: "Ember", value: "Ember" },
          { title: "Ekor", value: "Ekor" },
        ],
        layout: "dropdown",
      },
      validation: (Rule) => Rule.required(),
    }),
        defineField({
      name: "JumlahIkan",
      title: "Jumlah Ikan",
      type: "number",
      description: "Masukkan jumlah ikan sesuai kategori.",
      validation: (Rule) => Rule.required().integer().min(0),
    }),

    defineField({
      name: "description",
      title: "Catatan Tambahan",
      type: "text",
      rows: 4,
    }),

    defineField({
      name: "image",
      title: "Gambar Ikan",
      type: "image",
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "videoUrl",
      title: "Video Ikan",
      type: "url",
      description: "Masukkan URL video ikan.",
      validation: (Rule) =>
        Rule.uri({
          scheme: ["http", "https"],
        }),
    }),

    defineField({
      name: "price",
      title: "Harga Ikan",
      type: "number",
      description: "Masukkan harga dalam rupiah (IDR).",
      validation: (Rule) => Rule.required().integer().min(0),
    }),

  ],
});