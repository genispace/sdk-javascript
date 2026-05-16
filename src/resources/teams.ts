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
 * Team membership (current active team from token).
 */
export class Teams extends BaseClient {
  /**
   * List public profiles for members of the caller's active team.
   */
  async listMemberProfiles(params?: { status?: string }): Promise<PublicUserProfile[]> {
    const res = await this.get<PublicUserProfile[] | { data: PublicUserProfile[] }>(
      '/teams/members',
      params?.status ? { status: params.status } : undefined
    );
    return unwrapList<PublicUserProfile>(res);
  }
}
