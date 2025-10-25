import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        }
      }
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  async uploadImage(file: File, bucket: string = 'products'): Promise<string | null> {
    try {
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      const { data: { publicUrl } } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Unexpected error uploading image:', error);
      return null;
    }
  }

  async deleteImage(imageUrl: string, bucket: string = 'products'): Promise<boolean> {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) return false;

      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting image:', error);
      return false;
    }
  }
}
