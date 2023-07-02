export interface InstagramPageWithPost {
  items: Post[];
  num_results: number;
  more_available: boolean;
  auto_load_more_enabled: boolean;
  showQRModal: boolean;
}

export default InstagramPageWithPost;

export interface Post {
  taken_at: number;
  pk: number;
  id: string;
  device_timestamp: number;
  media_type: number;
  code: string;
  client_cache_key: string;
  filter_type: number;
  can_viewer_reshare: boolean;
  caption: Caption;
  clips_tab_pinned_user_ids: unknown[];
  comment_inform_treatment: CommentInformTreatment;
  sharing_friction_info: SharingFrictionInfo;
  caption_is_edited: boolean;
  original_media_has_visual_reply_media: boolean;
  like_and_view_counts_disabled: boolean;
  can_viewer_save: boolean;
  is_in_profile_grid: boolean;
  profile_grid_control_enabled: boolean;
  featured_products: unknown[];
  is_comments_gif_composer_enabled: boolean;
  product_suggestions: unknown[];
  user: User;
  image_versions2: ImageVersions;
  original_width: number;
  original_height: number;
  is_reshare_of_text_post_app_media_in_ig: boolean;
  comment_likes_enabled: boolean;
  comment_threading_enabled: boolean;
  max_num_visible_preview_comments: number;
  has_more_comments: boolean;
  preview_comments: PreviewComment[];
  comments: Comment[];
  comment_count: number;
  can_view_more_preview_comments: boolean;
  hide_view_all_comment_entrypoint: boolean;
  inline_composer_display_condition: string;
  has_liked: boolean;
  like_count: number;
  facepile_top_likers: FacepileTopLiker[];
  top_likers: string[];
  shop_routing_user_id: unknown;
  can_see_insights_as_brand: boolean;
  is_organic_product_tagging_eligible: boolean;
  product_type: string;
  is_paid_partnership: boolean;
  music_metadata: MusicMetadata;
  deleted_reason: number;
  organic_tracking_token: string;
  integrity_review_decision: string;
  ig_media_sharing_disabled: boolean;
  has_shared_to_fb: number;
  is_unified_video: boolean;
  should_request_ads: boolean;
  is_visual_reply_commenter_notice_enabled: boolean;
  commerciality_status: string;
  explore_hide_comments: boolean;
  has_delayed_metadata: boolean;
  carousel_media?: CarouselMedum[];
  carousel_media_ids?: number[];
  video_versions?: VideoVersion[];
}

export interface Caption {
  pk: string;
  user_id: number;
  text: string;
  type: number;
  created_at: number;
  created_at_utc: number;
  content_type: string;
  status: string;
  bit_flags: number;
  did_report_as_spam: boolean;
  share_enabled: boolean;
  user: User;
  is_covered: boolean;
  is_ranked_comment: boolean;
  media_id: number;
  has_translation: boolean;
  private_reply_status: number;
}

export interface User {
  has_anonymous_profile_picture: boolean;
  fan_club_info: FanClubInfo;
  fbid_v2: number;
  transparency_product_enabled: boolean;
  latest_reel_media: number;
  is_favorite: boolean;
  is_unpublished: boolean;
  pk: number;
  pk_id: string;
  username: string;
  full_name: string;
  is_private: boolean;
  is_verified: boolean;
  friendship_status: FriendshipStatus;
  profile_pic_url: string;
  account_badges: unknown[];
  feed_post_reshare_disabled: boolean;
  show_account_transparency_details: boolean;
  third_party_downloads_enabled: number;
}

export interface FanClubInfo {
  fan_club_id: unknown;
  fan_club_name: unknown;
  is_fan_club_referral_eligible: unknown;
  fan_consideration_page_revamp_eligiblity: unknown;
  is_fan_club_gifting_eligible: unknown;
  subscriber_count: unknown;
  connected_member_count: unknown;
  autosave_to_exclusive_highlight: unknown;
  has_enough_subscribers_for_ssc: unknown;
}

export interface FriendshipStatus {
  following: boolean;
  outgoing_request: boolean;
  is_bestie: boolean;
  is_restricted: boolean;
  is_feed_favorite: boolean;
}

export interface CommentInformTreatment {
  should_have_inform_treatment: boolean;
  text: string;
  url: unknown;
  action_type: unknown;
}

export interface SharingFrictionInfo {
  should_have_sharing_friction: boolean;
  bloks_app_url: unknown;
  sharing_friction_payload: unknown;
}

export interface ImageVersions {
  candidates: Candidate[];
}

export interface Candidate {
  width: number;
  height: number;
  url: string;
}

export interface PreviewComment {
  pk: string;
  user_id: number;
  text: string;
  type: number;
  created_at: number;
  created_at_utc: number;
  content_type: string;
  status: string;
  bit_flags: number;
  did_report_as_spam: boolean;
  share_enabled: boolean;
  user: UserSmaller;
  is_covered: boolean;
  is_ranked_comment: boolean;
  media_id: number;
  has_liked_comment: boolean;
  comment_like_count: number;
  has_translation: boolean;
  private_reply_status: number;
  parent_comment_id?: string;
}

export interface UserSmaller {
  pk: number;
  pk_id: string;
  username: string;
  full_name: string;
  is_private: boolean;
  is_verified: boolean;
  profile_pic_id?: string;
  profile_pic_url: string;
  fbid_v2: number;
}

export interface Comment {
  pk: string;
  user_id: number;
  text: string;
  type: number;
  created_at: number;
  created_at_utc: number;
  content_type: string;
  status: string;
  bit_flags: number;
  did_report_as_spam: boolean;
  share_enabled: boolean;
  user: UserSmaller;
  is_covered: boolean;
  is_ranked_comment: boolean;
  media_id: number;
  has_liked_comment: boolean;
  comment_like_count: number;
  has_translation: boolean;
  private_reply_status: number;
  parent_comment_id?: string;
}

export interface FacepileTopLiker {
  pk: number;
  pk_id: string;
  username: string;
  full_name: string;
  is_private: boolean;
  is_verified: boolean;
  profile_pic_id: string;
  profile_pic_url: string;
}

export interface MusicMetadata {
  music_canonical_id: string;
  audio_type: unknown;
  music_info: unknown;
  original_sound_info: unknown;
  pinned_media_ids: unknown;
}

export interface CarouselMedum {
  id: string;
  media_type: number;
  image_versions2: ImageVersions;
  video_versions?: VideoVersion[];
  original_width: number;
  original_height: number;
  explore_pivot_grid: boolean;
  product_type: string;
  carousel_parent_id: string;
  pk: number;
  usertags?: Usertags;
  featured_products: unknown[];
  commerciality_status: string;
  sharing_friction_info: SharingFrictionInfo;
  product_suggestions: unknown[];
}

export interface Usertags {
  in: In[];
}

export interface In {
  user: User;
  position: number[];
  start_time_in_video_in_sec: unknown;
  duration_in_video_in_sec: unknown;
}

export interface VideoVersion {
  type: number;
  width: number;
  height: number;
  url: string;
  id: string;
}
