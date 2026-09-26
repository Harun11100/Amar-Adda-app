import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Constants from "expo-constants";
import { uploadImages } from "@/upload/upload";

const COLORS = {
  primary: "#0B3C29",
  background: "#F8FAF9",
  card: "#FFFFFF",
  textMain: "#0F172A",
  textMuted: "#64748B",
  borderLight: "#E2E8F0",
  adminRed: "#F43F5E",
  successGreen: "#10B981",
};

const API_URL = Constants.expoConfig?.extra?.API_URL;

type SelectedImage = ImagePicker.ImagePickerAsset;

interface Category {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
}

export default function CreateFoodItemScreen() {
  const router = useRouter();

  const [itemName, setItemName] = useState("");

  // Store CATEGORY ID, not category name
  const [category, setCategory] = useState<Category | null>(
    null
  );

  const [categories, setCategories] = useState<Category[]>(
    []
  );

  const [categoryLoading, setCategoryLoading] =
    useState(false);

  const [showCategoryList, setShowCategoryList] =
    useState(false);

  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const [foodImage, setFoodImage] =
    useState<SelectedImage | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH CATEGORIES
  // ==========================================

  const fetchCategories = async () => {
    try {
      setCategoryLoading(true);

      const response = await fetch(
        `${API_URL}/api/admin/category/getCategory`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            "Failed to fetch categories."
        );
      }

      setCategories(result.categories || []);
    } catch (err: any) {
      console.error(
        "Fetch categories error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load categories."
      );
    } finally {
      setCategoryLoading(false);
    }
  };

  // Fetch categories whenever screen opens
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  // ==========================================
  // PICK IMAGE
  // ==========================================

  const pickImage = async () => {
    try {
      setError("");

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: false,
          quality: 0.7,
        });

      if (
        !result.canceled &&
        result.assets?.length
      ) {
        setFoodImage(result.assets[0]);
      }
    } catch (err) {
      console.error(
        "Image picker error:",
        err
      );

      Alert.alert(
        "Error",
        "The image could not be selected."
      );
    }
  };

  // ==========================================
  // REMOVE IMAGE
  // ==========================================

  const removeImage = () => {
    setFoodImage(null);
  };

  // ==========================================
  // SELECT CATEGORY
  // ==========================================

  const handleCategorySelect = (
    selectedCategory: Category
  ) => {
    setCategory(selectedCategory);
    setShowCategoryList(false);
    setError("");
  };

  // ==========================================
  // SUBMIT FOOD ITEM
  // ==========================================

  const handleSubmit = async () => {
    setError("");

    // ----------------------------
    // Validation
    // ----------------------------

    if (!itemName.trim()) {
      setError(
        "Food item name is required."
      );
      return;
    }

    if (!category?._id) {
      setError(
        "Please select a category."
      );
      return;
    }

    if (!price.trim()) {
      setError("Price is required.");
      return;
    }

    const numericPrice = Number(price);

    if (
      isNaN(numericPrice) ||
      numericPrice <= 0
    ) {
      setError(
        "Please enter a valid price."
      );
      return;
    }

    if (!description.trim()) {
      setError(
        "Description is required."
      );
      return;
    }

    if (!foodImage) {
      setError(
        "Please select a food item image."
      );
      return;
    }

    if (!API_URL) {
      setError(
        "API URL is not configured."
      );
      return;
    }

    setIsLoading(true);

    try {
      // ==================================
      // STEP 1: CREATE IMAGE FORM DATA
      // ==================================

      const imageFormData = new FormData();

      const uri = foodImage.uri;

      const extension =
        uri
          .split("?")[0]
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const mimeType =
        foodImage.mimeType ||
        (extension === "png"
          ? "image/png"
          : extension === "webp"
          ? "image/webp"
          : "image/jpeg");

      imageFormData.append(
        "images",
        {
          uri:
            Platform.OS === "ios"
              ? uri.replace("file://", "")
              : uri,
          name:
            foodImage.fileName ||
            `food-${Date.now()}.${extension}`,
          type: mimeType,
        } as any
      );

      // ==================================
      // STEP 2: UPLOAD IMAGE
      // ==================================

      const remoteUrls =
        await uploadImages(imageFormData);

      if (
        !remoteUrls ||
        remoteUrls.length === 0 ||
        !remoteUrls[0]
      ) {
        throw new Error(
          "Food image upload failed."
        );
      }

      const imageUrl = remoteUrls[0];

      // ==================================
      // STEP 3: CREATE FOOD ITEM
      // ==================================

      const payload = {
        name: itemName.trim(),

        // IMPORTANT:
        // Send Category ObjectId
        category: category._id,
        categoryName: category.name,

        price: numericPrice,

        description:
          description.trim(),

        // Your current backend expects
        // image URL
        image: imageUrl.url,

        isAvailable: true,
        isFeatured: false,
        spicyLevel: 0,
        isVegetarian: false,
        preparationTime: 15,
      };

      const response = await fetch(
        `${API_URL}/api/admin/food/createFood`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            "Failed to create food item."
        );
      }

      // ==================================
      // SUCCESS
      // ==================================

      Alert.alert(
        "Success",
        result.message ||
          "Food item created successfully.",
        [
          {
            text: "OK",
            onPress: () =>
              router.back(),
          },
        ]
      );
    } catch (err: any) {
      console.error(
        "Create food item error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create food item. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color="#FFF"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Add New Food Item
        </Text>

        <View
          style={{
            width: 38,
          }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        style={{
          flex: 1,
        }}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContainer
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* ================= ERROR ================= */}

          {error ? (
            <View
              style={
                styles.errorAlertBox
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={
                  COLORS.adminRed
                }
              />

              <Text
                style={
                  styles.errorAlertText
                }
              >
                {error}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setError("")
                }
              >
                <Ionicons
                  name="close"
                  size={18}
                  color={
                    COLORS.adminRed
                  }
                />
              </TouchableOpacity>
            </View>
          ) : null}

          <View
            style={styles.formCard}
          >
            {/* ================= IMAGE ================= */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={
                  styles.inputLabel
                }
              >
                Food Item Image *
              </Text>

              {foodImage ? (
                <View
                  style={
                    styles.imageWrapper
                  }
                >
                  <Image
                    source={{
                      uri: foodImage.uri,
                    }}
                    style={
                      styles.foodImage
                    }
                  />

                  <TouchableOpacity
                    style={
                      styles.removeImageButton
                    }
                    onPress={
                      removeImage
                    }
                    disabled={
                      isLoading
                    }
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <View
                    style={
                      styles.primaryBadge
                    }
                  >
                    <Text
                      style={
                        styles.primaryBadgeText
                      }
                    >
                      Food Image
                    </Text>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={
                    styles.addImageBox
                  }
                  onPress={
                    pickImage
                  }
                  activeOpacity={0.85}
                  disabled={
                    isLoading
                  }
                >
                  <View
                    style={
                      styles.cameraCircle
                    }
                  >
                    <Ionicons
                      name="camera-outline"
                      size={28}
                      color={
                        COLORS.primary
                      }
                    />
                  </View>

                  <Text
                    style={
                      styles.addImageText
                    }
                  >
                    Add Food Photo
                  </Text>

                  <Text
                    style={
                      styles.imageHint
                    }
                  >
                    JPG, PNG or WEBP
                  </Text>
                </TouchableOpacity>
              )}

              {foodImage && (
                <TouchableOpacity
                  style={
                    styles.changeImageButton
                  }
                  onPress={
                    pickImage
                  }
                  disabled={
                    isLoading
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="image-outline"
                    size={16}
                    color={
                      COLORS.primary
                    }
                  />

                  <Text
                    style={
                      styles.changeImageText
                    }
                  >
                    Change Image
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ================= FOOD NAME ================= */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={
                  styles.inputLabel
                }
              >
                Item Name *
              </Text>

              <View
                style={styles.inputBox}
              >
                <MaterialCommunityIcons
                  name="food-fork-drink"
                  size={18}
                  color={
                    COLORS.textMuted
                  }
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  style={
                    styles.textInput
                  }
                  placeholder="e.g. Cheese Burger Deluxe"
                  placeholderTextColor="#94A3B8"
                  value={itemName}
                  onChangeText={
                    setItemName
                  }
                  editable={
                    !isLoading
                  }
                />
              </View>
            </View>

            {/* ================= CATEGORY ================= */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={
                  styles.inputLabel
                }
              >
                Category *
              </Text>

              <TouchableOpacity
                style={[
                  styles.inputBox,
                  showCategoryList &&
                    styles.categoryInputActive,
                ]}
                onPress={() =>
                  setShowCategoryList(
                    !showCategoryList
                  )
                }
                disabled={
                  isLoading ||
                  categoryLoading
                }
                activeOpacity={0.8}
              >
                <Ionicons
                  name="list-outline"
                  size={18}
                  color={
                    COLORS.textMuted
                  }
                  style={
                    styles.inputIcon
                  }
                />

                <Text
                  style={[
                    styles.categorySelectedText,
                    !category &&
                      styles.placeholderText,
                  ]}
                >
                  {category
                    ? category.name
                    : categoryLoading
                    ? "Loading categories..."
                    : "Select a category"}
                </Text>

                {categoryLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      COLORS.primary
                    }
                  />
                ) : (
                  <Ionicons
                    name={
                      showCategoryList
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={18}
                    color={
                      COLORS.textMuted
                    }
                  />
                )}
              </TouchableOpacity>

              {/* CATEGORY LIST */}

              {showCategoryList && (
                <View
                  style={
                    styles.categoryDropdown
                  }
                >
                  {categories.length ===
                  0 ? (
                    <View
                      style={
                        styles.emptyCategoryBox
                      }
                    >
                      <MaterialCommunityIcons
                        name="shape-outline"
                        size={24}
                        color={
                          COLORS.textMuted
                        }
                      />

                      <Text
                        style={
                          styles.emptyCategoryText
                        }
                      >
                        No categories available.
                      </Text>
                    </View>
                  ) : (
                    categories.map(
                      (
                        categoryItem
                      ) => {
                        const selected =
                          category?._id ===
                          categoryItem._id;

                        return (
                          <TouchableOpacity
                            key={
                              categoryItem._id
                            }
                            style={[
                              styles.categoryOption,
                              selected &&
                                styles.selectedCategoryOption,
                            ]}
                            onPress={() =>
                              handleCategorySelect(
                                categoryItem
                              )
                            }
                            activeOpacity={
                              0.8
                            }
                          >
                            <View
                              style={
                                styles.categoryOptionIcon
                              }
                            >
                              <MaterialCommunityIcons
                                name="food"
                                size={
                                  17
                                }
                                color={
                                  selected
                                    ? COLORS.primary
                                    : COLORS.textMuted
                                }
                              />
                            </View>

                            <View
                              style={
                                styles.categoryOptionInfo
                              }
                            >
                              <Text
                                style={[
                                  styles.categoryOptionName,
                                  selected &&
                                    styles.selectedCategoryName,
                                ]}
                              >
                                {
                                  categoryItem.name
                                }
                              </Text>

                              <Text
                                style={
                                  styles.categoryOptionSlug
                                }
                              >
                                {
                                  categoryItem.slug
                                }
                              </Text>
                            </View>

                            {selected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={
                                  20
                                }
                                color={
                                  COLORS.successGreen
                                }
                              />
                            )}
                          </TouchableOpacity>
                        );
                      }
                    )
                  )}
                </View>
              )}
            </View>

            {/* ================= PRICE ================= */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={
                  styles.inputLabel
                }
              >
                Price (৳) *
              </Text>

              <View
                style={styles.inputBox}
              >
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={
                    COLORS.textMuted
                  }
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  style={
                    styles.textInput
                  }
                  placeholder="e.g. 350"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={
                    setPrice
                  }
                  editable={
                    !isLoading
                  }
                />
              </View>
            </View>

            {/* ================= DESCRIPTION ================= */}

            <View
              style={styles.inputGroup}
            >
              <Text
                style={
                  styles.inputLabel
                }
              >
                Description & Ingredients
              </Text>

              <View
                style={[
                  styles.inputBox,
                  styles.textAreaBox,
                ]}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    styles.textAreaInput,
                  ]}
                  placeholder="Briefly describe ingredients or taste notes..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={
                    description
                  }
                  onChangeText={
                    setDescription
                  }
                  editable={
                    !isLoading
                  }
                />
              </View>
            </View>

            {/* ================= SUBMIT ================= */}

            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading &&
                  styles.submitButtonDisabled,
              ]}
              onPress={
                handleSubmit
              }
              disabled={
                isLoading
              }
              activeOpacity={0.85}
            >
              {isLoading ? (
                <View
                  style={
                    styles.submitContent
                  }
                >
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />

                  <Text
                    style={[
                      styles.submitButtonText,
                      {
                        marginLeft: 8,
                      },
                    ]}
                  >
                    Publishing...
                  </Text>
                </View>
              ) : (
                <View
                  style={
                    styles.submitContent
                  }
                >
                  <Text
                    style={
                      styles.submitButtonText
                    }
                  >
                    Publish Food Item
                  </Text>

                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color="#FFFFFF"
                    style={{
                      marginLeft: 6,
                    }}
                  />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor:
      "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF",
  },

  scrollContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
    flexGrow: 1,
  },

  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 30,
  },

  errorAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },

  errorAlertText: {
    color: COLORS.adminRed,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },

  inputGroup: {
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.2,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: 14,
  },

  categoryInputActive: {
    borderColor: COLORS.primary,
  },

  inputIcon: {
    marginRight: 10,
  },

  textInput: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: 14,
    minHeight: 48,
    fontWeight: "500",
  },

  categorySelectedText: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: "600",
  },

  placeholderText: {
    color: "#94A3B8",
    fontWeight: "500",
  },

  // ================= CATEGORY DROPDOWN =================

  categoryDropdown: {
    marginTop: 6,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 14,
    overflow: "hidden",
  },

  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  selectedCategoryOption: {
    backgroundColor: "#F0FDF4",
  },

  categoryOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  categoryOptionInfo: {
    flex: 1,
  },

  categoryOptionName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textMain,
  },

  selectedCategoryName: {
    color: COLORS.primary,
  },

  categoryOptionSlug: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.textMuted,
  },

  emptyCategoryBox: {
    paddingVertical: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCategoryText: {
    marginTop: 7,
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // ================= IMAGE =================

  imageWrapper: {
    width: "100%",
    height: 210,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#F1F5F9",
  },

  foodImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor:
      "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  primaryBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  addImageBox: {
    width: "100%",
    height: 190,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E8F3EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  addImageText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },

  imageHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 5,
  },

  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: "#E8F3EE",
    gap: 6,
  },

  changeImageText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  // ================= TEXT AREA =================

  textAreaBox: {
    height: 100,
    alignItems: "flex-start",
    paddingVertical: 10,
  },

  textAreaInput: {
    height: "100%",
    textAlignVertical: "top",
  },

  // ================= SUBMIT =================

  submitButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});