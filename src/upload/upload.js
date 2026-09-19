import axios from "axios";

export const uploadImages = async (
  formData
) => {
  try {
    const { data } =
      await axios.post(
        "https://abdur-rahman-shoes-web-app.vercel.app/api/admin/cloudinary",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );
      
    if (!data?.urls) {
      return [];
    }

    return data.urls;
  } catch (error) {
    console.error(
      "Image upload failed:",
      error?.response?.data ||
        error?.message
    );

    return [];
  }
};