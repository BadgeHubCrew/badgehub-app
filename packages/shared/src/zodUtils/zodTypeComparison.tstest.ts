// Example usage with a Zod schema
import { z } from "zod/v3";
import { __tsCheckSame } from "@badgehub/shared/zodUtils/zodTypeComparison";

type SubObject = {
  subProperty: string;
  optionalSubProperty?: string;
};

type Dog = {
  name: string;
  neutered: boolean;
  optionalProperty?: string;
  subObject: SubObject;
};

let subObjectSchema = z.object({
  subProperty: z.string(),
  optionalSubProperty: z.string().optional(),
});
const dogSchema = z.object({
  name: z.string().min(3),
  neutered: z.boolean(),
  optionalProperty: z.string().optional(),
  subObject: subObjectSchema,
});

__tsCheckSame<Dog, Dog, z.infer<typeof dogSchema>>(true);

// @ts-expect-error missing non-optional properties are detected with descriptive error
__tsCheckSame<{}, {}, z.infer<typeof dogSchema>>(true);

type DogMissingOptional = Omit<Dog, "optionalProperty">;

__tsCheckSame<
  DogMissingOptional,
  DogMissingOptional,
  z.infer<typeof dogSchema>
>(
  // @ts-expect-error missing optional properties are detected as "true cannot be assigned to false"
  true
);

const dogSchemaMissingOptional = dogSchema.omit({ optionalProperty: true });
__tsCheckSame<Dog, Dog, z.infer<typeof dogSchemaMissingOptional>>(
  // @ts-expect-error missing optional properties are detected as "true cannot be assigned to false"
  true
);

__tsCheckSame<
  DogMissingOptional,
  DogMissingOptional,
  z.infer<typeof dogSchemaMissingOptional>
>(true);

type DogMissingSubOptional = {
  name: string;
  neutered: boolean;
  optionalProperty?: string;
  subObject: {
    subProperty: string;
  };
};

const dogSchemaMissingSubOptional = z.object({
  name: z.string().min(3),
  neutered: z.boolean(),
  optionalProperty: z.string().optional(),
  subObject: z.object({
    subProperty: z.string(),
  }),
});

__tsCheckSame<
  DogMissingSubOptional,
  DogMissingSubOptional,
  z.infer<typeof dogSchema>
>(
  // @ts-expect-error missing optional properties are detected as "true cannot be assigned to false"
  true
);

__tsCheckSame<Dog, Dog, z.infer<typeof dogSchemaMissingSubOptional>>(
  // @ts-expect-error missing optional properties are detected as "true cannot be assigned to false"
  true
);

__tsCheckSame<
  DogMissingSubOptional,
  DogMissingSubOptional,
  z.infer<typeof dogSchemaMissingSubOptional>
>(true);
