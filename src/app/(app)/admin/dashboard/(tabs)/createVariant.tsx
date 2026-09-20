import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronDown,
  Check,
  Plus,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.API_URL;

const COLORS = {
  primary: '#0B3C29',
  primaryDark: '#062D20',
  primaryLight: '#EAF3EE',

  orange: '#FF7A00',
  orangeDark: '#E96500',
  orangeLight: '#FFF1E5',

  background: '#F7F8F7',
  card: '#FFFFFF',

  text: '#17221D',
  textSecondary: '#68736D',
  muted: '#9AA39E',

  border: '#E8ECE9',
  white: '#FFFFFF',

  success: '#2E9B63',
  danger: '#D64545',
};

type Food = {
  _id: string;
  name: string;
  price: number;
  variants?: Variant[];
};

type Variant = {
  _id?: string;
  name: string;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
};

type VariantForm = {
  name: string;
  price: string;
  discountPrice: string;
  isAvailable: boolean;
};

const createEmptyVariant = (): VariantForm => ({
  name: '',
  price: '',
  discountPrice: '',
  isAvailable: true,
});

export default function CreateFoodVariantScreen() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const [variants, setVariants] = useState<VariantForm[]>([
    createEmptyVariant(),
  ]);

  const [showFoodList, setShowFoodList] = useState(false);

  const [loadingFoods, setLoadingFoods] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  /*
   * ============================
   * FETCH FOODS
   * ============================
   */

  const fetchFoods = async () => {
    try {
      setLoadingFoods(true);
      setError('');

      const response = await fetch(
        `${API_URL}/api/admin/food/getFood`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || 'Failed to fetch food items.'
        );
      }

      const foodData = Array.isArray(data)
        ? data
        : data.foods || data.data || [];

      setFoods(foodData);
    } catch (error: any) {
      console.error('Fetch foods error:', error);

      setError(
        error?.message || 'Unable to load food items.'
      );
    } finally {
      setLoadingFoods(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFoods();
    }, [])
  );

  /*
   * ============================
   * SELECT FOOD
   * ============================
   */

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setShowFoodList(false);

    /*
     * Start with one empty variant.
     *
     * We don't automatically copy existing variants
     * because this form is for adding new variants.
     */
    setVariants([createEmptyVariant()]);
  };

  /*
   * ============================
   * UPDATE VARIANT
   * ============================
   */

  const updateVariant = (
    index: number,
    field: keyof VariantForm,
    value: string | boolean
  ) => {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index
          ? {
              ...variant,
              [field]: value,
            }
          : variant
      )
    );
  };

  /*
   * ============================
   * ADD VARIANT
   * ============================
   */

  const addVariant = () => {
    setVariants((current) => [
      ...current,
      createEmptyVariant(),
    ]);
  };

  /*
   * ============================
   * REMOVE VARIANT
   * ============================
   */

  const removeVariant = (index: number) => {
    if (variants.length === 1) {
      Alert.alert(
        'Cannot remove',
        'At least one variant is required.'
      );

      return;
    }

    setVariants((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  /*
   * ============================
   * VALIDATE
   * ============================
   */

  const validateForm = () => {
    if (!selectedFood) {
      Alert.alert(
        'Select Food',
        'Please select a food item first.'
      );

      return false;
    }

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];

      if (!variant.name.trim()) {
        Alert.alert(
          'Variant Name Required',
          `Please enter a name for Variant ${i + 1}.`
        );

        return false;
      }

      const price = Number(variant.price);

      if (
        !variant.price ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        Alert.alert(
          'Invalid Price',
          `Please enter a valid price for Variant ${
            i + 1
          }.`
        );

        return false;
      }

      if (variant.discountPrice.trim()) {
        const discountPrice = Number(
          variant.discountPrice
        );

        if (
          !Number.isFinite(discountPrice) ||
          discountPrice < 0
        ) {
          Alert.alert(
            'Invalid Discount',
            `Please enter a valid discount price for Variant ${
              i + 1
            }.`
          );

          return false;
        }

        if (discountPrice > price) {
          Alert.alert(
            'Invalid Discount',
            `Discount price cannot be greater than the original price for Variant ${
              i + 1
            }.`
          );

          return false;
        }
      }
    }

    return true;
  };

  /*
   * ============================
   * SUBMIT
   * ============================
   */
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  if (!selectedFood) {
    return;
  }

  try {
    setSubmitting(true);

    const formattedVariants = variants.map((variant) => ({
      name: variant.name.trim(),
      price: Number(variant.price),
      discountPrice: variant.discountPrice.trim()
        ? Number(variant.discountPrice)
        : null,
      isAvailable: variant.isAvailable,
    }));

    const response = await fetch(
      `${API_URL}/api/admin/food/addVariant`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodId: selectedFood._id,
          variants: formattedVariants,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || 'Failed to add variants.'
      );
    }

    console.log('Add variants response:', data);

    Alert.alert(
      'Success',
      data?.message || 'Food variants added successfully.',
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset selected food
            setSelectedFood(null);

            // Reset variants
            setVariants([createEmptyVariant()]);

            // Close food dropdown if open
            setShowFoodList(false);

            // Refresh food list
            fetchFoods();
          },
        },
      ]
    );
  } catch (error: any) {
    console.error(
      'Create variants error:',
      error
    );

    Alert.alert(
      'Error',
      error?.message ||
        'Something went wrong while adding variants.'
    );
  } finally {
    setSubmitting(false);
  }
};
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================= HEADER ================= */}

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <UtensilsCrossed
              size={22}
              color={COLORS.white}
            />
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              Food Variants
            </Text>

            <Text style={styles.headerSubtitle}>
              Add sizes, types or options
            </Text>
          </View>
        </View>

        {/* ================= ERROR ================= */}

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* ================= SELECT FOOD ================= */}

        <View style={styles.section}>
          <Text style={styles.label}>
            Select Food
          </Text>

          <TouchableOpacity
            style={[
              styles.selectButton,
              selectedFood &&
                styles.selectButtonSelected,
            ]}
            activeOpacity={0.8}
            onPress={() =>
              setShowFoodList((current) => !current)
            }
          >
            <View style={styles.selectLeft}>
              <View style={styles.foodIcon}>
                <UtensilsCrossed
                  size={18}
                  color={COLORS.primary}
                />
              </View>

              <View>
                <Text
                  style={[
                    styles.selectText,
                    !selectedFood &&
                      styles.placeholderText,
                  ]}
                >
                  {selectedFood
                    ? selectedFood.name
                    : 'Choose a food item'}
                </Text>

                {selectedFood ? (
                  <Text style={styles.foodBasePrice}>
                    Base price: ৳
                    {selectedFood.price}
                  </Text>
                ) : null}
              </View>
            </View>

            <ChevronDown
              size={19}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {/* FOOD LIST */}

          {showFoodList ? (
            <View style={styles.foodList}>
              {loadingFoods ? (
                <View style={styles.foodLoading}>
                  <ActivityIndicator
                    size="small"
                    color={COLORS.primary}
                  />

                  <Text style={styles.loadingText}>
                    Loading food...
                  </Text>
                </View>
              ) : foods.length === 0 ? (
                <Text style={styles.noFoodText}>
                  No food items found.
                </Text>
              ) : (
                foods.map((food) => {
                  const isSelected =
                    selectedFood?._id === food._id;

                  return (
                    <TouchableOpacity
                      key={food._id}
                      style={[
                        styles.foodOption,
                        isSelected &&
                          styles.foodOptionSelected,
                      ]}
                      activeOpacity={0.75}
                      onPress={() =>
                        handleSelectFood(food)
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.foodOptionName
                          }
                        >
                          {food.name}
                        </Text>

                        <Text
                          style={
                            styles.foodOptionPrice
                          }
                        >
                          Base price: ৳
                          {food.price}
                        </Text>
                      </View>

                      {isSelected ? (
                        <Check
                          size={19}
                          color={COLORS.primary}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ) : null}
        </View>

        {/* ================= SELECTED FOOD ================= */}

        {selectedFood ? (
          <View style={styles.selectedFoodCard}>
            <View>
              <Text style={styles.selectedFoodLabel}>
                Selected Food
              </Text>

              <Text style={styles.selectedFoodName}>
                {selectedFood.name}
              </Text>
            </View>

            <View style={styles.basePriceBadge}>
              <Text
                style={styles.basePriceBadgeText}
              >
                Base ৳{selectedFood.price}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ================= VARIANTS ================= */}

        <View style={styles.section}>
          <View style={styles.variantHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Variants
              </Text>

              <Text style={styles.sectionSubtitle}>
                Add different sizes or options
              </Text>
            </View>

            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {variants.length}
              </Text>
            </View>
          </View>

          {variants.map((variant, index) => (
            <View
              key={index}
              style={styles.variantCard}
            >
              {/* VARIANT HEADER */}

              <View style={styles.variantCardHeader}>
                <View style={styles.variantNumber}>
                  <Text
                    style={
                      styles.variantNumberText
                    }
                  >
                    {index + 1}
                  </Text>
                </View>

                <Text style={styles.variantTitle}>
                  Variant {index + 1}
                </Text>

                {variants.length > 1 ? (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      removeVariant(index)
                    }
                    activeOpacity={0.75}
                  >
                    <Trash2
                      size={17}
                      color={COLORS.danger}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* NAME */}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Variant Name
                </Text>

                <TextInput
                  value={variant.name}
                  onChangeText={(value) =>
                    updateVariant(
                      index,
                      'name',
                      value
                    )
                  }
                  placeholder="e.g. Regular, Cheese, Large"
                  placeholderTextColor={
                    COLORS.muted
                  }
                  style={styles.input}
                />
              </View>

              {/* PRICE ROW */}

              <View style={styles.priceRow}>
                <View
                  style={[
                    styles.inputGroup,
                    styles.priceInput,
                  ]}
                >
                  <Text style={styles.inputLabel}>
                    Price
                  </Text>

                  <View
                    style={styles.priceInputWrapper}
                  >
                    <Text
                      style={styles.currency}
                    >
                      ৳
                    </Text>

                    <TextInput
                      value={variant.price}
                      onChangeText={(value) =>
                        updateVariant(
                          index,
                          'price',
                          value
                        )
                      }
                      placeholder="190"
                      placeholderTextColor={
                        COLORS.muted
                      }
                      keyboardType="decimal-pad"
                      style={
                        styles.priceTextInput
                      }
                    />
                  </View>
                </View>

                <View
                  style={[
                    styles.inputGroup,
                    styles.priceInput,
                  ]}
                >
                  <Text style={styles.inputLabel}>
                    Discount Price
                  </Text>

                  <View
                    style={styles.priceInputWrapper}
                  >
                    <Text
                      style={styles.currency}
                    >
                      ৳
                    </Text>

                    <TextInput
                      value={
                        variant.discountPrice
                      }
                      onChangeText={(value) =>
                        updateVariant(
                          index,
                          'discountPrice',
                          value
                        )
                      }
                      placeholder="Optional"
                      placeholderTextColor={
                        COLORS.muted
                      }
                      keyboardType="decimal-pad"
                      style={
                        styles.priceTextInput
                      }
                    />
                  </View>
                </View>
              </View>

              {/* AVAILABILITY */}

              <View style={styles.availabilityRow}>
                <View>
                  <Text
                    style={
                      styles.availabilityTitle
                    }
                  >
                    Available
                  </Text>

                  <Text
                    style={
                      styles.availabilitySubtitle
                    }
                  >
                    Customers can order this variant
                  </Text>
                </View>

                <Switch
                  value={variant.isAvailable}
                  onValueChange={(value) =>
                    updateVariant(
                      index,
                      'isAvailable',
                      value
                    )
                  }
                  trackColor={{
                    false: COLORS.border,
                    true: '#A9D8BD',
                  }}
                  thumbColor={
                    variant.isAvailable
                      ? COLORS.primary
                      : '#FFFFFF'
                  }
                />
              </View>
            </View>
          ))}

          {/* ADD VARIANT */}

          <TouchableOpacity
            style={styles.addVariantButton}
            onPress={addVariant}
            activeOpacity={0.8}
          >
            <View style={styles.addVariantIcon}>
              <Plus
                size={18}
                color={COLORS.primary}
              />
            </View>

            <Text style={styles.addVariantText}>
              Add Another Variant
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= SUBMIT ================= */}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedFood || submitting) &&
              styles.submitButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={!selectedFood || submitting}
        >
          {submitting ? (
            <ActivityIndicator
              size="small"
              color={COLORS.white}
            />
          ) : (
            <Check
              size={19}
              color={COLORS.white}
              strokeWidth={2.5}
            />
          )}

          <Text style={styles.submitButtonText}>
            {submitting
              ? 'Saving Variants...'
              : 'Upload Variants'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    paddingBottom: 30,
  },

  /* ================= HEADER ================= */

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,

    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor:
      'rgba(255,255,255,0.12)',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 3,
  },

  /* ================= SECTION ================= */

  section: {
    marginHorizontal: 20,
    marginTop: 23,
  },

  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  /* ================= SELECT FOOD ================= */

  selectButton: {
    minHeight: 65,
    borderRadius: 16,
    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: COLORS.border,

    paddingHorizontal: 13,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectButtonSelected: {
    borderColor: '#B9D6C7',
  },

  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  foodIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  selectText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  placeholderText: {
    color: COLORS.muted,
    fontWeight: '600',
  },

  foodBasePrice: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  /* ================= FOOD LIST ================= */

  foodList: {
    marginTop: 7,
    backgroundColor: COLORS.white,

    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,

    overflow: 'hidden',
  },

  foodOption: {
    minHeight: 58,
    paddingHorizontal: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  foodOptionSelected: {
    backgroundColor: COLORS.primaryLight,
  },

  foodOptionName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  foodOptionPrice: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  foodLoading: {
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  noFoodText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  /* ================= SELECTED FOOD ================= */

  selectedFoodCard: {
    marginHorizontal: 20,
    marginTop: 14,

    padding: 15,
    borderRadius: 17,

    backgroundColor: COLORS.primaryLight,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedFoodLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  selectedFoodName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 3,
  },

  basePriceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: COLORS.white,
  },

  basePriceBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '800',
  },

  /* ================= VARIANTS ================= */

  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    marginBottom: 12,
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 10,

    backgroundColor: COLORS.primaryLight,

    alignItems: 'center',
    justifyContent: 'center',
  },

  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },

  variantCard: {
    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 19,

    padding: 15,
    marginBottom: 12,
  },

  variantCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 15,
  },

  variantNumber: {
    width: 29,
    height: 29,
    borderRadius: 10,

    backgroundColor: COLORS.primary,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,
  },

  variantNumberText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },

  variantTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },

  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,

    backgroundColor: '#FDECEC',

    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ================= INPUT ================= */

  inputGroup: {
    marginBottom: 14,
  },

  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,

    marginBottom: 7,
  },

  input: {
    height: 46,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 12,

    backgroundColor: '#FCFDFC',

    paddingHorizontal: 13,

    color: COLORS.text,

    fontSize: 12,
    fontWeight: '600',
  },

  priceRow: {
    flexDirection: 'row',
    gap: 10,
  },

  priceInput: {
    flex: 1,
  },

  priceInputWrapper: {
    height: 46,

    borderWidth: 1,
    borderColor: COLORS.border,

    borderRadius: 12,

    backgroundColor: '#FCFDFC',

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 11,
  },

  currency: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,

    marginRight: 5,
  },

  priceTextInput: {
    flex: 1,

    height: 44,

    padding: 0,

    color: COLORS.text,

    fontSize: 12,
    fontWeight: '700',
  },

  /* ================= AVAILABILITY ================= */

  availabilityRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,

    paddingTop: 13,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  availabilityTitle: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '800',
  },

  availabilitySubtitle: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 3,
  },

  /* ================= ADD ================= */

  addVariantButton: {
    height: 50,

    borderRadius: 14,

    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#B8CEC1',

    backgroundColor: COLORS.primaryLight,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,
  },

  addVariantIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,

    backgroundColor: COLORS.white,

    alignItems: 'center',
    justifyContent: 'center',
  },

  addVariantText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },

  /* ================= SUBMIT ================= */

  submitButton: {
    marginHorizontal: 20,
    marginTop: 25,

    height: 53,

    borderRadius: 16,

    backgroundColor: COLORS.orange,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,
  },

  submitButtonDisabled: {
    opacity: 0.45,
  },

  submitButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },

  /* ================= ERROR ================= */

  errorCard: {
    marginHorizontal: 20,
    marginTop: 16,

    padding: 13,

    borderRadius: 13,

    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F4CACA',
  },

  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    lineHeight: 17,
  },
});
