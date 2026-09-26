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
  Sparkles,
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

  background: '#F4F6F4',
  card: '#FFFFFF',

  text: '#111B17',
  textSecondary: '#5A655F',
  muted: '#8C9691',

  border: '#E2E8E4',
  white: '#FFFFFF',

  success: '#2E9B63',
  danger: '#E05252',
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
  description?: string;
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
};

type VariantForm = {
  name: string;
  description: string;
  price: string;
  discountPrice: string;
  isAvailable: boolean;
};

const createEmptyVariant = (): VariantForm => ({
  name: '',
  description: '',
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

  const fetchFoods = async () => {
    try {
      setLoadingFoods(true);
      setError('');
      const response = await fetch(`${API_URL}/api/admin/food/getFood`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to fetch food items.');
      }

      const foodData = Array.isArray(data)
        ? data
        : data.foods || data.data || [];
      setFoods(foodData);
    } catch (error: any) {
      console.error('Fetch foods error:', error);
      setError(error?.message || 'Unable to load food items.');
    } finally {
      setLoadingFoods(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFoods();
    }, [])
  );

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setShowFoodList(false);
    setVariants([createEmptyVariant()]);
  };

  const updateVariant = (
    index: number,
    field: keyof VariantForm,
    value: string | boolean
  ) => {
    setVariants((current) =>
      current.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const addVariant = () => {
    setVariants((current) => [...current, createEmptyVariant()]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) {
      Alert.alert('Cannot remove', 'At least one variant is required.');
      return;
    }
    setVariants((current) => current.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!selectedFood) {
      Alert.alert('Select Food', 'Please select a food item first.');
      return false;
    }

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      if (!variant.name.trim()) {
        Alert.alert('Variant Name Required', `Please enter a name for Variant ${i + 1}.`);
        return false;
      }

      const price = Number(variant.price);
      if (!variant.price || !Number.isFinite(price) || price < 0) {
        Alert.alert('Invalid Price', `Please enter a valid price for Variant ${i + 1}.`);
        return false;
      }

      if (variant.discountPrice.trim()) {
        const discountPrice = Number(variant.discountPrice);
        if (!Number.isFinite(discountPrice) || discountPrice < 0) {
          Alert.alert('Invalid Discount', `Please enter a valid discount price for Variant ${i + 1}.`);
          return false;
        }
        if (discountPrice > price) {
          Alert.alert('Invalid Discount', `Discount price cannot be greater than the original price for Variant ${i + 1}.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !selectedFood) return;

    try {
      setSubmitting(true);
      const formattedVariants = variants.map((variant) => ({
        name: variant.name.trim(),
        description: variant.description.trim() || undefined,
        price: Number(variant.price),
        discountPrice: variant.discountPrice.trim()
          ? Number(variant.discountPrice)
          : null,
        isAvailable: variant.isAvailable,
      }));

      const response = await fetch(`${API_URL}/api/admin/create-variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodId: selectedFood._id,
          variants: formattedVariants,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to add variants.');
      }

      Alert.alert('Success', data?.message || 'Food variants added successfully.', [
        {
          text: 'OK',
          onPress: () => {
            setSelectedFood(null);
            setVariants([createEmptyVariant()]);
            setShowFoodList(false);
            fetchFoods();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Create variants error:', error);
      Alert.alert('Error', error?.message || 'Something went wrong while adding variants.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* FIXED HEADER */}
      <View style={styles.header}>
        <View style={styles.headerIconWrapper}>
          <UtensilsCrossed size={20} color={COLORS.primary} />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Food Variants</Text>
          <Text style={styles.headerSubtitle}>Customize sizes, portions & options</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ERROR BANNER */}
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* SELECT FOOD SECTION */}
        <View style={styles.section}>
          <Text style={styles.label}>TARGET FOOD ITEM</Text>

          <TouchableOpacity
            style={[styles.selectButton, selectedFood && styles.selectButtonSelected]}
            activeOpacity={0.8}
            onPress={() => setShowFoodList((current) => !current)}
          >
            <View style={styles.selectLeft}>
              <View style={styles.foodIcon}>
                <Sparkles size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.selectText,
                    !selectedFood && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {selectedFood ? selectedFood.name : 'Select a food item'}
                </Text>
                {selectedFood ? (
                  <Text style={styles.foodBasePrice}>Base Price: ৳{selectedFood.price}</Text>
                ) : null}
              </View>
            </View>
            <ChevronDown size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {/* FOOD DROPDOWN LIST */}
          {showFoodList ? (
            <View style={styles.foodList}>
              {loadingFoods ? (
                <View style={styles.foodLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Loading items...</Text>
                </View>
              ) : foods.length === 0 ? (
                <Text style={styles.noFoodText}>No food items found.</Text>
              ) : (
                foods.map((food) => {
                  const isSelected = selectedFood?._id === food._id;
                  return (
                    <TouchableOpacity
                      key={food._id}
                      style={[styles.foodOption, isSelected && styles.foodOptionSelected]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectFood(food)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.foodOptionName}>{food.name}</Text>
                        <Text style={styles.foodOptionPrice}>৳{food.price}</Text>
                      </View>
                      {isSelected && <Check size={18} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ) : null}
        </View>

        {/* VARIANTS BUILDER */}
        <View style={styles.section}>
          <View style={styles.variantHeader}>
            <View>
              <Text style={styles.sectionTitle}>Variant Configurations</Text>
              <Text style={styles.sectionSubtitle}>Define individual attributes for this item</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{variants.length}</Text>
            </View>
          </View>

          {variants.map((variant, index) => (
            <View key={index} style={styles.variantCard}>
              <View style={styles.variantCardHeader}>
                <View style={styles.variantNumber}>
                  <Text style={styles.variantNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.variantTitle}>Variant Option #{index + 1}</Text>

                {variants.length > 1 ? (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeVariant(index)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* VARIANT NAME */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>VARIANT NAME</Text>
                <TextInput
                  value={variant.name}
                  onChangeText={(value) => updateVariant(index, 'name', value)}
                  placeholder="e.g. Regular, Large, Spicy"
                  placeholderTextColor={COLORS.muted}
                  style={styles.input}
                />
              </View>

              {/* DESCRIPTION */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>DESCRIPTION (OPTIONAL)</Text>
                <TextInput
                  value={variant.description}
                  onChangeText={(value) => updateVariant(index, 'description', value)}
                  placeholder="e.g. Serves 1-2 people"
                  placeholderTextColor={COLORS.muted}
                  style={styles.input}
                />
              </View>

              {/* PRICE & DISCOUNT ROW */}
              <View style={styles.priceRow}>
                <View style={[styles.inputGroup, styles.priceInput]}>
                  <Text style={styles.inputLabel}>PRICE</Text>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.currency}>৳</Text>
                    <TextInput
                      value={variant.price}
                      onChangeText={(value) => updateVariant(index, 'price', value)}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.muted}
                      keyboardType="decimal-pad"
                      style={styles.priceTextInput}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, styles.priceInput]}>
                  <Text style={styles.inputLabel}>DISCOUNT PRICE</Text>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.currency}>৳</Text>
                    <TextInput
                      value={variant.discountPrice}
                      onChangeText={(value) => updateVariant(index, 'discountPrice', value)}
                      placeholder="Optional"
                      placeholderTextColor={COLORS.muted}
                      keyboardType="decimal-pad"
                      style={styles.priceTextInput}
                    />
                  </View>
                </View>
              </View>

              {/* AVAILABILITY SWITCH */}
              <View style={styles.availabilityRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.availabilityTitle}>Active & Available</Text>
                  <Text style={styles.availabilitySubtitle}>Enable clients to order this choice right away</Text>
                </View>
                <Switch
                  value={variant.isAvailable}
                  onValueChange={(value) => updateVariant(index, 'isAvailable', value)}
                  trackColor={{ false: COLORS.border, true: '#A9D8BD' }}
                  thumbColor={variant.isAvailable ? COLORS.primary : '#FFFFFF'}
                />
              </View>
            </View>
          ))}

          {/* ADD VARIANT BUTTON */}
          <TouchableOpacity
            style={styles.addVariantButton}
            onPress={addVariant}
            activeOpacity={0.8}
          >
            <View style={styles.addVariantIcon}>
              <Plus size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.addVariantText}>Add Another Variant</Text>
          </TouchableOpacity>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedFood || submitting) && styles.submitButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={!selectedFood || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Check size={18} color={COLORS.white} strokeWidth={2.5} />
          )}
          <Text style={styles.submitButtonText}>
            {submitting ? 'Saving Variants...' : 'Save & Publish Variants'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    paddingBottom: 24,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    backgroundColor: COLORS.primary,
    borderBottomColor: COLORS.border,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#d4d4d4',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#898989',
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  selectButton: {
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '30',
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  foodIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.muted,
    fontWeight: '500',
  },
  foodBasePrice: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  foodList: {
    marginTop: 6,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  foodOption: {
    minHeight: 52,
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
    fontWeight: '700',
    color: COLORS.text,
  },
  foodOptionPrice: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  foodLoading: {
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  noFoodText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  variantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  variantCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  variantCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  variantNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  variantNumberText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  variantTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: '#FAFBFA',
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priceInput: {
    flex: 1,
  },
  priceInputWrapper: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: '#FAFBFA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  currency: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 4,
  },
  priceTextInput: {
    flex: 1,
    height: 40,
    padding: 0,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  availabilityRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availabilityTitle: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '700',
  },
  availabilitySubtitle: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  addVariantButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#B8CEC1',
    backgroundColor: COLORS.primaryLight + '50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  addVariantIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVariantText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  submitButton: {
    marginHorizontal: 20,
    marginTop: 24,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  errorCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F4CACA',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});