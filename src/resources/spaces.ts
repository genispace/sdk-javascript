import { BaseClient } from '../client/base';
import { PublicUserProfile } from '../types';

function unwrapList<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object' && 'data' in res) {
    const data = (res as { data: unknown }).data;
    if (Array.isArray(data)) return data as T[];
  }
  return [];
}

/**
 * Space membership (current active space from token).
 */
export class Spaces extends BaseClient {
  /**
   * List public profiles for members of the caller's active space.
   */
  async listMemberProfiles(params?: { status?: string }): Promise<PublicUserProfile[]> {
    const res = await this.get<PublicUserProfile[] | { data: PublicUserProfile[] }>(
      '/spaces/members',
      params?.status ? { status: params.status } : undefined
    );
    return unwrapList<PublicUserProfile>(res);
  }
}
