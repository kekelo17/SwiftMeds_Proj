export type UserRole = 'client' | 'pharmacist' | 'admin';
export type PharmacyStatus = 'pending' | 'approved' | 'suspended' | 'rejected' | 'deleted';
export type ReservationStatus =
  | 'created' | 'pending' | 'confirmed' | 'ready' | 'collected' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded';
export type PaymentMethodType = 'mtn_momo' | 'orange_money' | 'campay' | 'card';
export type NotificationType =
  | 'reservation' | 'payment' | 'pharmacy_approval' | 'inventory' | 'review' | 'general';

export interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  address: string | null;
  date_of_birth: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientRow {
  client_id: string;
  user_id: string;
  is_premium: boolean;
  created_at: string;
}

export interface OpeningHours {
  [day: string]: { open: string; close: string } | undefined;
}

export interface PharmacyRow {
  pharmacy_id: string;
  name: string;
  address: string;
  contact_info: string | null;
  phone: string | null;
  email: string | null;
  license_number: string;
  latitude: number | null;
  longitude: number | null;
  opening_hours: OpeningHours;
  is_24h: boolean;
  average_rating: number;
  status: PharmacyStatus;
  is_approved: boolean;
  rejection_reason: string | null;
  license_doc_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PharmacistRow {
  pharmacist_id: string;
  user_id: string;
  pharmacy_id: string | null;
  license_number: string;
  is_owner: boolean;
  created_at: string;
}

export interface CategoryRow {
  category_id: string;
  name: string;
  description: string | null;
}

export interface MedicationRow {
  medication_id: string;
  name: string;
  generic_name: string | null;
  description: string | null;
  dosage: string | null;
  price: number;
  category_id: string | null;
  requires_prescription: boolean;
  is_controlled: boolean;
  image_url: string | null;
  created_at: string;
}

export interface InventoryRow {
  inventory_id: string;
  pharmacy_id: string;
  medication_id: string;
  quantity: number;
  low_stock_alert: number;
  last_updated: string;
}

export interface ReservationRow {
  reservation_id: string;
  client_id: string;
  pharmacy_id: string;
  medication_id: string;
  patient_name: string | null;
  quantity: number;
  total_amount: number;
  status: ReservationStatus;
  prescription_url: string | null;
  pickup_code: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface PaymentRow {
  payment_id: string;
  reservation_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethodType;
  status: PaymentStatus;
  transaction_reference: string | null;
  external_reference: string | null;
  phone_number: string | null;
  timestamp: string;
}

export interface ReviewRow {
  review_id: string;
  client_id: string;
  pharmacy_id: string;
  rating: number;
  comment: string | null;
  date: string;
}

export interface NotificationRow {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  related_id: string | null;
  sent_at: string;
}

export interface NearbyPharmacyResult {
  pharmacy_id: string;
  name: string;
  address: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  opening_hours: OpeningHours;
  is_24h: boolean;
  average_rating: number;
  distance_meters: number;
  matching_medication_id: string | null;
  matching_medication_name: string | null;
  matching_price: number | null;
  matching_quantity: number | null;
}

// Minimal Database type so @supabase/ssr generics resolve.
// Replace with `supabase gen types typescript` output for full type-safety.
export type Database = {
  public: {
    Tables: {
      users: { Row: UserRow; Insert: Partial<UserRow>; Update: Partial<UserRow> };
      clients: { Row: ClientRow; Insert: Partial<ClientRow>; Update: Partial<ClientRow> };
      pharmacies: { Row: PharmacyRow; Insert: Partial<PharmacyRow>; Update: Partial<PharmacyRow> };
      pharmacists: { Row: PharmacistRow; Insert: Partial<PharmacistRow>; Update: Partial<PharmacistRow> };
      categories: { Row: CategoryRow; Insert: Partial<CategoryRow>; Update: Partial<CategoryRow> };
      medications: { Row: MedicationRow; Insert: Partial<MedicationRow>; Update: Partial<MedicationRow> };
      inventory: { Row: InventoryRow; Insert: Partial<InventoryRow>; Update: Partial<InventoryRow> };
      reservations: { Row: ReservationRow; Insert: Partial<ReservationRow>; Update: Partial<ReservationRow> };
      payments: { Row: PaymentRow; Insert: Partial<PaymentRow>; Update: Partial<PaymentRow> };
      reviews: { Row: ReviewRow; Insert: Partial<ReviewRow>; Update: Partial<ReviewRow> };
      notifications: { Row: NotificationRow; Insert: Partial<NotificationRow>; Update: Partial<NotificationRow> };
    };
    Functions: {
      nearby_pharmacies: {
        Args: { user_lat: number; user_lng: number; radius_meters?: number; medication_query?: string | null };
        Returns: NearbyPharmacyResult[];
      };
      create_reservation: {
        Args: {
          p_client_id: string; p_pharmacy_id: string; p_medication_id: string;
          p_quantity: number; p_patient_name?: string | null; p_prescription_url?: string | null;
        };
        Returns: ReservationRow;
      };
      cancel_reservation: { Args: { p_reservation_id: string }; Returns: void };
      admin_stats: { Args: Record<string, never>; Returns: Record<string, number> };
      pharmacy_stats: { Args: { p_pharmacy_id: string }; Returns: Record<string, number> };
    };
  };
};
