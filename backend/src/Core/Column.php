<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Description of a single table column.
 *
 * The column only carries the portable intent (name, type, length, scale and
 * the flags). The Schema builder turns it into the DDL of the active driver.
 */
final class Column
{
    public const TYPE_ID = 'id';
    public const TYPE_STRING = 'string';
    public const TYPE_TEXT = 'text';
    public const TYPE_INTEGER = 'integer';
    public const TYPE_BIG_INTEGER = 'big_integer';
    public const TYPE_BOOLEAN = 'boolean';
    public const TYPE_DECIMAL = 'decimal';
    public const TYPE_DATE = 'date';
    public const TYPE_DATE_TIME = 'datetime';

    private string $name;

    private string $type;

    private int $length;

    private int $scale;

    private bool $nullable = false;

    private bool $unique = false;

    private bool $indexed = false;

    private bool $autoIncrement = false;

    private mixed $default = null;

    public function __construct(string $name, string $type, int $length = 191, int $scale = 2)
    {
        $this->name = $name;
        $this->type = $type;
        $this->length = $length;
        $this->scale = $scale;
        $this->autoIncrement = $type === self::TYPE_ID;
    }

    /**
     * The auto-incrementing primary key column.
     */
    public static function id(string $name = 'id'): self
    {
        return new self($name, self::TYPE_ID);
    }

    /**
     * A short text column (defaults to 191 characters, the MySQL index limit).
     */
    public static function string(string $name, int $length = 191): self
    {
        return new self($name, self::TYPE_STRING, $length);
    }

    /**
     * A long text column.
     */
    public static function text(string $name): self
    {
        return new self($name, self::TYPE_TEXT);
    }

    /**
     * An integer column.
     */
    public static function integer(string $name): self
    {
        return new self($name, self::TYPE_INTEGER);
    }

    /**
     * A big integer column.
     */
    public static function bigInteger(string $name): self
    {
        return new self($name, self::TYPE_BIG_INTEGER);
    }

    /**
     * A boolean column.
     */
    public static function boolean(string $name): self
    {
        return new self($name, self::TYPE_BOOLEAN);
    }

    /**
     * A fixed precision decimal column (money).
     */
    public static function decimal(string $name, int $precision = 15, int $scale = 2): self
    {
        return new self($name, self::TYPE_DECIMAL, $precision, $scale);
    }

    /**
     * A date column.
     */
    public static function date(string $name): self
    {
        return new self($name, self::TYPE_DATE);
    }

    /**
     * A date and time column.
     */
    public static function dateTime(string $name): self
    {
        return new self($name, self::TYPE_DATE_TIME);
    }

    public function name(): string
    {
        return $this->name;
    }

    public function type(): string
    {
        return $this->type;
    }

    public function length(): int
    {
        return $this->length;
    }

    public function scale(): int
    {
        return $this->scale;
    }

    /**
     * Mark the column as nullable.
     */
    public function nullable(): self
    {
        $this->nullable = true;

        return $this;
    }

    /**
     * Mark the column as unique.
     */
    public function unique(): self
    {
        $this->unique = true;

        return $this;
    }

    /**
     * Mark the column as indexed.
     */
    public function indexed(): self
    {
        $this->indexed = true;

        return $this;
    }

    public function isNullable(): bool
    {
        return $this->nullable;
    }

    public function isUnique(): bool
    {
        return $this->unique;
    }

    public function isIndexed(): bool
    {
        return $this->indexed;
    }

    public function isAutoIncrement(): bool
    {
        return $this->autoIncrement;
    }

    /**
     * Set a default value for the column.
     */
    public function default(mixed $value): self
    {
        $this->default = $value;

        return $this;
    }

    /**
     * The value used when a column is left empty.
     */
    public function defaultValue(): ?string
    {
        if ($this->default === null) {
            return null;
        }

        if (is_bool($this->default)) {
            return $this->default ? '1' : '0';
        }

        if (is_int($this->default) || is_float($this->default)) {
            return (string) $this->default;
        }

        return sprintf("'%s'", str_replace("'", "''", (string) $this->default));
    }
}
