import type * as prismic from "@prismicio/client";

type Simplify<T> = { [KeyType in keyof T]: T[KeyType] };


type PickContentRelationshipFieldData<
	TRelationship extends prismic.CustomTypeModelFetchCustomTypeLevel1 | prismic.CustomTypeModelFetchCustomTypeLevel2 | prismic.CustomTypeModelFetchGroupLevel1 | prismic.CustomTypeModelFetchGroupLevel2,
	TData extends Record<string, prismic.AnyRegularField | prismic.GroupField | prismic.NestedGroupField | prismic.SliceZone>,
	TLang extends string
> = |
	// Content relationship fields
	{
		[TSubRelationship in Extract<
			TRelationship["fields"][number], prismic.CustomTypeModelFetchContentRelationshipLevel1
		> as TSubRelationship["id"]]:
			ContentRelationshipFieldWithData<TSubRelationship["customtypes"], TLang>;
	} &
	// Group
	{
		[TGroup in Extract<
			TRelationship["fields"][number], prismic.CustomTypeModelFetchGroupLevel1 | prismic.CustomTypeModelFetchGroupLevel2
		> as TGroup["id"]]:
			TData[TGroup["id"]] extends prismic.GroupField<infer TGroupData>
				? prismic.GroupField<PickContentRelationshipFieldData<TGroup, TGroupData, TLang>>
				: never
	} &
	// Other fields
	{
		[TFieldKey in Extract<TRelationship["fields"][number], string>]:
			TFieldKey extends keyof TData ? TData[TFieldKey] : never;
	};

type ContentRelationshipFieldWithData<
	TCustomType extends readonly (prismic.CustomTypeModelFetchCustomTypeLevel1 | string)[] | readonly (prismic.CustomTypeModelFetchCustomTypeLevel2 | string)[],
	TLang extends string = string
> = {
	[ID in Exclude<TCustomType[number], string>["id"]]:
		prismic.ContentRelationshipField<
			ID,
			TLang,
			PickContentRelationshipFieldData<
				Extract<TCustomType[number], { id: ID }>,
				Extract<prismic.Content.AllDocumentTypes, { type: ID }>["data"],
				TLang
			>
		>
}[Exclude<TCustomType[number], string>["id"]];

/**
 * Content for Blog Category documents
 */
interface BlogCategoryDocumentData {
	/**
	 * Name field in *Blog Category*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Marketing
	 * - **API ID Path**: blog_category.name
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	name: prismic.KeyTextField;
}

/**
 * Blog Category document from Prismic
 *
 * - **API ID**: `blog_category`
 * - **Repeatable**: `true`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type BlogCategoryDocument<Lang extends string = string> = prismic.PrismicDocumentWithUID<Simplify<BlogCategoryDocumentData>, "blog_category", Lang>;

type BlogPostDocumentDataSlicesSlice = RichTextSlice

/**
 * Content for Blog Post documents
 */
interface BlogPostDocumentData {
	/**
	 * Title field in *Blog Post*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: blog_post.title
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	title: prismic.KeyTextField;
	
	/**
	 * Description field in *Blog Post*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: blog_post.description
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	description: prismic.KeyTextField;
	
	/**
	 * Image field in *Blog Post*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: blog_post.image
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	image: prismic.ImageField<never>;
	
	/**
	 * Category field in *Blog Post*
	 *
	 * - **Field Type**: Content Relationship
	 * - **Placeholder**: *None*
	 * - **API ID Path**: blog_post.category
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/content-relationship
	 */
	category: ContentRelationshipFieldWithData<[{"id":"blog_category","fields":["name"]}]>;
	
	/**
	 * Published Date field in *Blog Post*
	 *
	 * - **Field Type**: Date
	 * - **Placeholder**: *None*
	 * - **API ID Path**: blog_post.published_date
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/date
	 */
	published_date: prismic.DateField;
	
	/**
	 * Slice Zone field in *Blog Post*
	 *
	 * - **Field Type**: Slice Zone
	 * - **Placeholder**: *None*
	 * - **API ID Path**: blog_post.slices[]
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/slices
	 */
	slices: prismic.SliceZone<BlogPostDocumentDataSlicesSlice>;
}

/**
 * Blog Post document from Prismic
 *
 * - **API ID**: `blog_post`
 * - **Repeatable**: `true`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type BlogPostDocument<Lang extends string = string> = prismic.PrismicDocumentWithUID<Simplify<BlogPostDocumentData>, "blog_post", Lang>;

type FaqDocumentDataSlicesSlice = FaqGroupSlice

/**
 * Content for FAQ documents
 */
interface FaqDocumentData {
	/**
	 * Slice Zone field in *FAQ*
	 *
	 * - **Field Type**: Slice Zone
	 * - **Placeholder**: *None*
	 * - **API ID Path**: faq.slices[]
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/slices
	 */
	slices: prismic.SliceZone<FaqDocumentDataSlicesSlice>;
}

/**
 * FAQ document from Prismic
 *
 * - **API ID**: `faq`
 * - **Repeatable**: `false`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type FaqDocument<Lang extends string = string> = prismic.PrismicDocumentWithoutUID<Simplify<FaqDocumentData>, "faq", Lang>;

/**
 * Content for Marketing Material documents
 */
interface MarketingMaterialDocumentData {
	/**
	 * Title field in *Marketing Material*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: marketing_material.title
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	title: prismic.KeyTextField;
	
	/**
	 * Image field in *Marketing Material*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: marketing_material.image
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	image: prismic.ImageField<never>;
}

/**
 * Marketing Material document from Prismic
 *
 * - **API ID**: `marketing_material`
 * - **Repeatable**: `true`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type MarketingMaterialDocument<Lang extends string = string> = prismic.PrismicDocumentWithoutUID<Simplify<MarketingMaterialDocumentData>, "marketing_material", Lang>;

/**
 * Content for Video Tutorial documents
 */
interface VideoTutorialDocumentData {
	/**
	 * Title field in *Video Tutorial*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: Tutorial title
	 * - **API ID Path**: video_tutorial.title
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	title: prismic.KeyTextField;
	
	/**
	 * Description field in *Video Tutorial*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: Short description of the video
	 * - **API ID Path**: video_tutorial.description
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	description: prismic.KeyTextField;
	
	/**
	 * Video field in *Video Tutorial*
	 *
	 * - **Field Type**: Link to Media
	 * - **Placeholder**: *None*
	 * - **API ID Path**: video_tutorial.video
	 * - **Tab**: Main
	 * - **Documentation**: https://prismic.io/docs/fields/link-to-media
	 */
	video: prismic.LinkToMediaField<prismic.FieldState, never>;
}

/**
 * Video Tutorial document from Prismic
 *
 * - **API ID**: `video_tutorial`
 * - **Repeatable**: `true`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type VideoTutorialDocument<Lang extends string = string> = prismic.PrismicDocumentWithoutUID<Simplify<VideoTutorialDocumentData>, "video_tutorial", Lang>;

export type AllDocumentTypes = BlogCategoryDocument | BlogPostDocument | FaqDocument | MarketingMaterialDocument | VideoTutorialDocument;

/**
 * Item in *FAQ Group → Default → Primary → Questions*
 */
export interface FaqGroupSliceDefaultPrimaryItemsItem {
	/**
	 * Question field in *FAQ Group → Default → Primary → Questions*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. How does the affiliate program work?
	 * - **API ID Path**: faq_group.default.primary.items[].question
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	question: prismic.KeyTextField;
	
	/**
	 * Answer field in *FAQ Group → Default → Primary → Questions*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: faq_group.default.primary.items[].answer
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	answer: prismic.RichTextField;
}

/**
 * Primary content in *FAQ Group → Default → Primary*
 */
export interface FaqGroupSliceDefaultPrimary {
	/**
	 * Title field in *FAQ Group → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. How the Program Works
	 * - **API ID Path**: faq_group.default.primary.title
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	title: prismic.KeyTextField;
	
	/**
	 * Description field in *FAQ Group → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: Short summary of this group
	 * - **API ID Path**: faq_group.default.primary.description
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	description: prismic.KeyTextField;
	
	/**
	 * Questions field in *FAQ Group → Default → Primary*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: faq_group.default.primary.items[]
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	items: prismic.GroupField<Simplify<FaqGroupSliceDefaultPrimaryItemsItem>>;
}

/**
 * Default variation for FAQ Group Slice
 *
 * - **API ID**: `default`
 * - **Description**: Default
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type FaqGroupSliceDefault = prismic.SharedSliceVariation<"default", Simplify<FaqGroupSliceDefaultPrimary>, never>;

/**
 * Slice variation for *FAQ Group*
 */
type FaqGroupSliceVariation = FaqGroupSliceDefault

/**
 * FAQ Group Shared Slice
 *
 * - **API ID**: `faq_group`
 * - **Description**: *None*
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type FaqGroupSlice = prismic.SharedSlice<"faq_group", FaqGroupSliceVariation>;

/**
 * Primary content in *Rich Text → Default → Primary*
 */
export interface RichTextSliceDefaultPrimary {
	/**
	 * Content field in *Rich Text → Default → Primary*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: rich_text.default.primary.content
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	content: prismic.RichTextField;
}

/**
 * Default variation for Rich Text Slice
 *
 * - **API ID**: `default`
 * - **Description**: Default
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type RichTextSliceDefault = prismic.SharedSliceVariation<"default", Simplify<RichTextSliceDefaultPrimary>, never>;

/**
 * Slice variation for *Rich Text*
 */
type RichTextSliceVariation = RichTextSliceDefault

/**
 * Rich Text Shared Slice
 *
 * - **API ID**: `rich_text`
 * - **Description**: *None*
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type RichTextSlice = prismic.SharedSlice<"rich_text", RichTextSliceVariation>;

declare module "@prismicio/client" {
	interface CreateClient {
		(repositoryNameOrEndpoint: string, options?: prismic.ClientConfig): prismic.Client<AllDocumentTypes>;
	}
	
	interface CreateWriteClient {
		(repositoryNameOrEndpoint: string, options: prismic.WriteClientConfig): prismic.WriteClient<AllDocumentTypes>;
	}
	
	interface CreateMigration {
		(): prismic.Migration<AllDocumentTypes>;
	}
	
	namespace Content {
		export type {
			BlogCategoryDocument,
			BlogCategoryDocumentData,
			BlogPostDocument,
			BlogPostDocumentData,
			BlogPostDocumentDataSlicesSlice,
			FaqDocument,
			FaqDocumentData,
			FaqDocumentDataSlicesSlice,
			MarketingMaterialDocument,
			MarketingMaterialDocumentData,
			VideoTutorialDocument,
			VideoTutorialDocumentData,
			AllDocumentTypes,
			FaqGroupSlice,
			FaqGroupSliceDefaultPrimaryItemsItem,
			FaqGroupSliceDefaultPrimary,
			FaqGroupSliceVariation,
			FaqGroupSliceDefault,
			RichTextSlice,
			RichTextSliceDefaultPrimary,
			RichTextSliceVariation,
			RichTextSliceDefault
		}
	}
}